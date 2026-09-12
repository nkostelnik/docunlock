# docunlock

Removes editing restrictions from a `.docx` file so you can redline it freely.

Counterparties often send Word documents with Track Changes forced on and the protection locked behind a password. docunlock strips that restriction and hands the document back, ready for markup.

## How it works

A `.docx` file is a ZIP archive. Document protection (forced Track Changes, read-only, comments-only, forms-only) is recorded as a `<w:documentProtection>` element inside `word/settings.xml`. docunlock opens the archive in the browser with JSZip, removes that element, repackages the file, and offers the result as `unlocked_<original name>.docx`.

Nothing is uploaded. The file never leaves your machine, which matters when the document is a draft agreement.

## What it does not do

This only removes the protection flag. It does **not** decrypt a document that was encrypted with an open password, the kind Word demands before it will show you any content at all. Those files fail with an error, because there is nothing to strip until the file is decrypted.

It also does not recover or reveal the protection password. It removes the restriction rather than defeating the password.

## Using it

1. Open the app.
2. Drag a `.docx` file onto the drop zone, or click to browse.
3. Download the unlocked copy.

## Running it locally

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build     # build for production
npm run preview   # serve the production build
```

## Built with

React 19, TypeScript, Vite, and JSZip.

## A note on use

Removing protection changes how a document can be edited, not who is allowed to edit it. Restrictions are sometimes there for a reason. Use your judgment about the document in front of you.
