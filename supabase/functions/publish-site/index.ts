import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface UserSite {
  id: string
  site_name: string
  template_id: string | null
  content: Record<string, any> | null
  netlify_site_id: string | null
}

interface Template {
  template_slug: string
}

interface PageMeta {
  file: string
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

function applyScalarFieldToHtml(
  html: string,
  key: string,
  stringValue: string
): string {
  const escapedKey = escapeRegExp(key)

  const tagRegex = new RegExp(
    `<([a-zA-Z][\\w:-]*)(?=[^>]*\\bdata-edit="${escapedKey}")[^>]*>`,
    "g"
  )

  html = html.replace(tagRegex, (tag, tagName) => {
    if (hasEditRole(tag, "background")) {
      return setBackgroundImage(tag, stringValue)
    }

    if (hasEditRole(tag, "href")) {
      return setAttribute(tag, "href", stringValue)
    }

    if (tagName.toLowerCase() === "source") {
      return setAttribute(tag, "srcset", stringValue)
    }

    if (tagName.toLowerCase() === "img" || hasEditRole(tag, "img")) {
      const imageTag = setAttribute(tag, "src", stringValue)
      return removeAttribute(imageTag, "srcset")
    }

    return tag
  })

  const textRegex = new RegExp(
    `(<(?!img\\b|source\\b)([a-zA-Z][\\w:-]*)(?=[^>]*\\bdata-edit="${escapedKey}")(?![^>]*\\bdata-edit-role="(?:background|href|img)")[^>]*>)([\\s\\S]*?)(<\\/\\2>)`,
    "g"
  )

  return html.replace(textRegex, `$1${stringValue}$4`)
}

function findMatchingCloseTag(
  html: string,
  tagName: string,
  searchFrom: number
): number {
  let depth = 1
  let i = searchFrom
  const openRe = new RegExp(`<${tagName}\\b[^>]*>`, "gi")
  const closeRe = new RegExp(`</${tagName}>`, "gi")

  while (depth > 0) {
    openRe.lastIndex = i
    closeRe.lastIndex = i
    const openMatch = openRe.exec(html)
    const closeMatch = closeRe.exec(html)

    if (!closeMatch) return -1

    if (openMatch && openMatch.index < closeMatch.index) {
      depth++
      i = openMatch.index + openMatch[0].length
    } else {
      depth--
      if (depth === 0) return closeMatch.index
      i = closeMatch.index + closeMatch[0].length
    }
  }

  return -1
}

function extractFirstElement(html: string): string | null {
  const trimmed = html.trimStart()
  const openMatch = trimmed.match(/^<([a-zA-Z][\w:-]*)\b[^>]*>/)
  if (!openMatch) return null

  const tagName = openMatch[1]
  const innerStart = openMatch[0].length
  const closeIndex = findMatchingCloseTag(trimmed, tagName, innerStart)
  if (closeIndex === -1) return null

  return trimmed.slice(0, closeIndex + `</${tagName}>`.length)
}

function applyRepeatGroupHtml(
  html: string,
  key: string,
  items: Record<string, any>[]
): string {
  const openTagRegex = new RegExp(
    `<([a-zA-Z][\\w:-]*)([^>]*\\bdata-repeat="${escapeRegExp(key)}"[^>]*)>`,
    "i"
  )
  const openMatch = openTagRegex.exec(html)
  if (!openMatch) return html

  const tagName = openMatch[1]
  const innerStart = openMatch.index + openMatch[0].length
  const closeIndex = findMatchingCloseTag(html, tagName, innerStart)
  if (closeIndex === -1) return html

  const innerHtml = html.slice(innerStart, closeIndex)
  const template = extractFirstElement(innerHtml)
  if (!template) return html

  const built = items
    .map((item) => {
      let fragment = template
      for (const [subKey, subValue] of Object.entries(item)) {
        if (subValue === undefined || subValue === null || typeof subValue === "object") {
          continue
        }
        fragment = applyScalarFieldToHtml(fragment, subKey, String(subValue))
      }
      return fragment
    })
    .join("")

  return html.slice(0, innerStart) + built + html.slice(closeIndex)
}

function injectWebsiteData(html: string, data: Record<string, unknown>): string {
  const script = `<script>window.websiteData=${JSON.stringify(data)};</script>`
  if (html.includes("</body>")) {
    return html.replace("</body>", `${script}\n</body>`)
  }
  return html + script
}

function applyContent(
  templateHtml: string,
  content: Record<string, any>
): string {

  let html = templateHtml

  for (const [key, value] of Object.entries(content)) {
    if (Array.isArray(value)) {
      html = applyRepeatGroupHtml(html, key, value)
    }
  }

  for (const [key, value] of Object.entries(content)) {
    if (value === undefined || value === null || typeof value === "object") {
      continue
    }
    html = applyScalarFieldToHtml(html, key, String(value))
  }

  return html
}

function getPageContent(
  content: Record<string, any>,
  pageFile: string
): Record<string, any> {
  if (!content?.pages) return content ?? {}

  const page = content.pages[pageFile] ?? content.pages["index.html"] ?? {}
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(page)) {
    if (["editor", "_seo", "seo", "inventory", "blog"].includes(key)) continue
    result[key] = value
  }

  for (const section of ["editor", "_seo", "seo", "inventory", "blog"]) {
    const sectionContent = page[section]
    if (!sectionContent || typeof sectionContent !== "object") continue
    Object.assign(result, sectionContent)
  }

  return result
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function hasEditRole(tag: string, role: string): boolean {
  return new RegExp(`\\bdata-edit-role="${role}"`).test(tag)
}

function setAttribute(tag: string, attr: string, value: string): string {
  const escapedValue = escapeAttribute(value)
  const attrRegex = new RegExp(`\\s${attr}="[^"]*"`)

  if (attrRegex.test(tag)) {
    return tag.replace(attrRegex, ` ${attr}="${escapedValue}"`)
  }

  return tag.replace(/\s*\/?>$/, (ending) =>
    ending.startsWith("/")
      ? ` ${attr}="${escapedValue}"${ending}`
      : ` ${attr}="${escapedValue}">`
  )
}

function removeAttribute(tag: string, attr: string): string {
  return tag.replace(new RegExp(`\\s${attr}="[^"]*"`, "g"), "")
}

function setBackgroundImage(tag: string, value: string): string {
  const escapedValue = escapeAttribute(value)
  const styleMatch = tag.match(/\sstyle="([^"]*)"/)

  if (!styleMatch) {
    return setAttribute(tag, "style", `background-image:url('${escapedValue}')`)
  }

  const style = styleMatch[1]
  const nextStyle = /background-image\s*:\s*url\((["'])?.*?\1\)/.test(style)
    ? style.replace(
        /background-image\s*:\s*url\((["'])?.*?\1\)/,
        `background-image:url('${escapedValue}')`
      )
    : `${style};background-image:url('${escapedValue}')`

  return tag.replace(/\sstyle="[^"]*"/, ` style="${nextStyle}"`)
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
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

async function deployToNetlify(siteId: string, files: Record<string, string>) {

  const encoder = new TextEncoder()
  const encodedFiles: Record<string, Uint8Array> = {}
  const manifest: Record<string, string> = {}

  for (const [fileName, html] of Object.entries(files)) {
    const bytes = encoder.encode(html)
    const shaBuffer = await crypto.subtle.digest("SHA-1", bytes)
    const shaArray = Array.from(new Uint8Array(shaBuffer))
    const sha = shaArray.map(b => b.toString(16).padStart(2, "0")).join("")

    encodedFiles[fileName] = bytes
    manifest[fileName] = sha
  }

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
        files: manifest
      })
    }
  )

  const deploy = await deployRes.json()

  if (!deploy.id) {
    console.error("Deploy manifest error:", deploy)
    throw new Error("Failed to create Netlify deploy")
  }

  /* upload file */

  for (const [fileName, bytes] of Object.entries(encodedFiles)) {
    const uploadRes = await fetch(
      `https://api.netlify.com/api/v1/deploys/${deploy.id}/files/${fileName}`,
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
      throw new Error(`Failed to upload ${fileName}`)
    }
  }

  return deploy.ssl_url
}

async function getTemplatePages(templateSlug: string): Promise<PageMeta[]> {
  const pagesUrl = `${TEMPLATE_BASE_URL}/${templateSlug}/pages.json`
  const pagesRes = await fetch(pagesUrl)

  if (!pagesRes.ok) {
    return [{ file: "index.html" }]
  }

  const pages = await pagesRes.json()
  if (!Array.isArray(pages) || pages.length === 0) {
    return [{ file: "index.html" }]
  }

  return pages
    .filter((page): page is PageMeta => !!page?.file)
    .map((page) => ({ file: page.file }))
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

    const templatePages = await getTemplatePages(typedTemplate.template_slug)
    const files: Record<string, string> = {}

    for (const page of templatePages) {
      const templateUrl =
        `${TEMPLATE_BASE_URL}/${typedTemplate.template_slug}/${page.file}`

      const templateRes = await fetch(templateUrl)

      if (!templateRes.ok) {
        throw new Error(`Failed to fetch template HTML for ${page.file}`)
      }

      const templateHtml = await templateRes.text()

      files[page.file] = applyContent(
        templateHtml,
        getPageContent(typedSite.content ?? {}, page.file)
      )
    }

    /* Deploy auxiliary pages (e.g. blog-single.html) with shared data */
    const blogSingleUrl =
      `${TEMPLATE_BASE_URL}/${typedTemplate.template_slug}/blog-single.html`
    const blogSingleRes = await fetch(blogSingleUrl)

    if (blogSingleRes.ok) {
      const blogContent = getPageContent(typedSite.content ?? {}, "blog.html")
      files["blog-single.html"] = injectWebsiteData(
        await blogSingleRes.text(),
        { articles: blogContent.articles ?? [] }
      )
    }

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
      files
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
