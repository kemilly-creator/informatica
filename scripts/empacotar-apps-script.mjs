import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const index = readFileSync("dist/index.html", "utf8");
const scriptTag = /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/;
const styleTag = /<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/;
if (!scriptTag.test(index) || !styleTag.test(index)) {
  throw new Error("O build precisa conter um arquivo JavaScript e um arquivo CSS.");
}
const html = index.replace(scriptTag, (_, path) => {
  const script = readFileSync("dist/assets/" + basename(path), "utf8");
  return '<script type="module">' + script.replace(/<\/script/gi, "<\\/script") + "</script>";
}).replace(styleTag, (_, path) => {
  const css = readFileSync("dist/assets/" + basename(path), "utf8");
  return "<style>" + css + "</style>";
});
writeFileSync("apps-script/UniversoIF.html", html);
