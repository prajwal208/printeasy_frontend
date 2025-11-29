import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const fontsDir = path.join(process.cwd(), "public", "fonts");

  const files = fs.readdirSync(fontsDir);

 
  const fontNames = files
    .filter((file) => file.endsWith(".ttf"))
    .map((file) => file.replace(".ttf", ""));

  return NextResponse.json(fontNames);
}
