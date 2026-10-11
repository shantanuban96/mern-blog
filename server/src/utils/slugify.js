// "Hello, World!" -> "hello-world"
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove special characters
    .replace(/[\s-]+/g, '-') // spaces -> single dash
    .replace(/^-|-$/g, '') // trim dashes
    .slice(0, 80);
}

module.exports = slugify;
