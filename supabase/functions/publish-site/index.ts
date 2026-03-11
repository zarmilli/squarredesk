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

async function createNetlifySite(siteName: string) {

  const response = await fetch(
    "https://api.netlify.com/api/v1/sites",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: siteName
      })
    }
  )

  const data = await response.json()

  if (!data.id) {
    throw new Error("Failed to create Netlify site")
  }

  return {
    siteId: data.id as string,
    url: data.ssl_url as string
  }
}

async function deployToNetlify(siteId: string, html: string) {

  const base64Html = btoa(html)

  const response = await fetch(
    `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        files: {
          "/index.html": base64Html
        }
      })
    }
  )

  const data = await response.json()

  return data.ssl_url as string
}

serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {

    const { siteId } = await req.json()

    if (!siteId) {
      return new Response(
        JSON.stringify({ error: "Missing siteId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    const { data: site, error: siteError } = await supabase
      .from("user_sites")
      .select("id, site_name, template_id, content, netlify_site_id")
      .eq("id", siteId)
      .single()

    if (siteError || !site) {
      return new Response(
        JSON.stringify({ error: "Site not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    const typedSite = site as UserSite

    if (!typedSite.template_id) {
      return new Response(
        JSON.stringify({ error: "Template missing" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select("template_slug")
      .eq("id", typedSite.template_id)
      .single()

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: "Template not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    const typedTemplate = template as Template

    const templateUrl =
      `${TEMPLATE_BASE_URL}/${typedTemplate.template_slug}/index.html`

    const templateRes = await fetch(templateUrl)

    const templateHtml = await templateRes.text()

    const finalHtml = applyContent(
      templateHtml,
      typedSite.content ?? {}
    )

    let netlifySiteId = typedSite.netlify_site_id

    if (!netlifySiteId) {

      const cleanName = typedSite.site_name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")

      const netlifySite = await createNetlifySite(cleanName)

      netlifySiteId = netlifySite.siteId

      await supabase
        .from("user_sites")
        .update({
          netlify_site_id: netlifySiteId
        })
        .eq("id", typedSite.id)
    }

    const deployUrl = await deployToNetlify(
      netlifySiteId,
      finalHtml
    )

    await supabase
      .from("user_sites")
      .update({
        is_published: true
      })
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

    console.error(err)

    return new Response(
      JSON.stringify({
        error: "Publish failed"
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