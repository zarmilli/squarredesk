import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface UserSite {
  id: string
  site_name: string
  template_id: string | null
  content: Record<string, string> | null
  netlify_site_id: string | null
}

interface Template {
  template_slug: string
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const NETLIFY_TOKEN = Deno.env.get("NETLIFY_API_TOKEN")!
const TEMPLATE_BASE_URL = Deno.env.get("TEMPLATE_BASE_URL")!

/* -----------------------------
CONTENT INJECTION
------------------------------*/

function applyContent(
  templateHtml: string,
  content: Record<string, string>
): string {

  let html = templateHtml

  for (const key of Object.keys(content)) {

    const value = content[key]

    const backgroundRegex = new RegExp(
      `(<[^>]*data-edit="${key}"[^>]*style="[^"]*background-image:url\\('[^']*'\\)[^"]*"[^>]*>)`,
      "g"
    )

    html = html.replace(backgroundRegex, (match) => {
      return match.replace(
        /background-image:url\('[^']*'\)/,
        `background-image:url('${value}')`
      )
    })

    const textRegex = new RegExp(
      `(<[^>]*data-edit="${key}"[^>]*>)([\\s\\S]*?)(<\\/[^>]+>)`,
      "g"
    )

    html = html.replace(textRegex, `$1${value}$3`)
  }

  return html
}

/* -----------------------------
CREATE NETLIFY SITE
------------------------------*/

async function createNetlifySite() {

  const response = await fetch(
    "https://api.netlify.com/api/v1/sites",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    }
  )

  const data = await response.json()

  if (!response.ok || !data.id) {
    console.error("Netlify create error:", data)
    throw new Error("Failed to create Netlify site")
  }

  return {
    siteId: data.id as string,
    url: data.ssl_url as string
  }
}

/* -----------------------------
DEPLOY HTML TO NETLIFY
------------------------------*/

async function deployToNetlify(siteId: string, html: string) {

  const encoder = new TextEncoder()
  const bytes = encoder.encode(html)

  const shaBuffer = await crypto.subtle.digest("SHA-1", bytes)
  const shaArray = Array.from(new Uint8Array(shaBuffer))
  const sha = shaArray.map(b => b.toString(16).padStart(2, "0")).join("")

  /* create deploy manifest */

  const deployRes = await fetch(
    `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        files: {
          "index.html": sha
        }
      })
    }
  )

  const deploy = await deployRes.json()

  if (!deploy.id) {
    console.error("Deploy manifest error:", deploy)
    throw new Error("Failed to create Netlify deploy")
  }

  /* upload file */

  const uploadRes = await fetch(
    `https://api.netlify.com/api/v1/deploys/${deploy.id}/files/index.html`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        "Content-Type": "application/octet-stream"
      },
      body: bytes
    }
  )

  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    console.error("Upload error:", err)
    throw new Error("Failed to upload HTML")
  }

  return deploy.ssl_url
}

/* -----------------------------
EDGE FUNCTION
------------------------------*/

serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {

    const { siteId } = await req.json()

    if (!siteId) {
      throw new Error("Missing siteId")
    }

    const { data: site } = await supabase
      .from("user_sites")
      .select("id, site_name, template_id, content, netlify_site_id")
      .eq("id", siteId)
      .single()

    if (!site) {
      throw new Error("Site not found")
    }

    const typedSite = site as UserSite

    if (!typedSite.template_id) {
      throw new Error("Template missing")
    }

    const { data: template } = await supabase
      .from("templates")
      .select("template_slug")
      .eq("id", typedSite.template_id)
      .single()

    if (!template) {
      throw new Error("Template not found")
    }

    const typedTemplate = template as Template

    const templateUrl =
      `${TEMPLATE_BASE_URL}/${typedTemplate.template_slug}/index.html`

    const templateRes = await fetch(templateUrl)

    if (!templateRes.ok) {
      throw new Error("Failed to fetch template HTML")
    }

    const templateHtml = await templateRes.text()

    const finalHtml = applyContent(
      templateHtml,
      typedSite.content ?? {}
    )

    let netlifySiteId = typedSite.netlify_site_id

    /* create Netlify site once */

    if (!netlifySiteId) {

      const netlifySite = await createNetlifySite()

      netlifySiteId = netlifySite.siteId

      await supabase
        .from("user_sites")
        .update({ netlify_site_id: netlifySiteId })
        .eq("id", typedSite.id)
    }

    /* deploy HTML */

    const deployUrl = await deployToNetlify(
      netlifySiteId,
      finalHtml
    )

    await supabase
      .from("user_sites")
      .update({ is_published: true })
      .eq("id", typedSite.id)

    return new Response(
      JSON.stringify({
        success: true,
        url: deployUrl
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    )

  } catch (err) {

    console.error("Publish error:", err)

    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Publish failed"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    )
  }
})