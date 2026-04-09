import { serveDir } from "jsr:@std/http/file-server";

Deno.serve((request) => {
  return serveDir(request, {
    fsRoot: "dist",
    quiet: true,
  });
});
