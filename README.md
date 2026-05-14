# Bret Wallace 40th Birthday Site

This is a small private-link static site for Bret Wallace's 40th birthday.

## Preview

Start a local static server from this folder, then open the shown local URL.

The current birthday code is:

```text
Bret40
```

## Updating Later

Most editable content lives in:

```text
data/site-data.json
```

Add new notes to the `notes` array, new party questions to the `questions` array, and new photo entries to the `photos` array.

The site currently assigns photos to message sections automatically in order. When you are ready, this can be changed to a more exact per-person mapping.

## Photos

The current photo files are HEIC. Some browsers, especially Chrome on Windows, do not display HEIC images. For reliable hosting, convert the photos to JPG or PNG and update the `src` values in `data/site-data.json`.

## Hosting Privately

The simplest route is Netlify or Vercel with an unlisted URL plus the birthday-code screen. That keeps casual visitors out, but it is not strong security because this is a static website.

For stronger privacy, use a host with real access control, such as Cloudflare Pages with Cloudflare Access, or a password-protected deployment option from the hosting provider.
