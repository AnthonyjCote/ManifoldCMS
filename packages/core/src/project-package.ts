import { mkdir } from "node:fs/promises";
import path from "node:path";

import AdmZip from "adm-zip";

const PACKAGE_EXTENSION = ".manifold";

export function ensurePackageFileName(filePath: string): string {
  return filePath.endsWith(PACKAGE_EXTENSION) ? filePath : `${filePath}${PACKAGE_EXTENSION}`;
}

export async function packageProject(projectDir: string, outputFilePath: string): Promise<string> {
  const absoluteProjectDir = path.resolve(projectDir);
  const absoluteOutputPath = path.resolve(ensurePackageFileName(outputFilePath));

  await mkdir(path.dirname(absoluteOutputPath), { recursive: true });

  const zip = new AdmZip();
  zip.addLocalFolder(absoluteProjectDir);
  zip.writeZip(absoluteOutputPath);

  return absoluteOutputPath;
}

export async function importProjectPackage(
  packageFilePath: string,
  outputProjectDir: string
): Promise<string> {
  const absolutePackageFilePath = path.resolve(packageFilePath);
  const absoluteOutputDir = path.resolve(outputProjectDir);

  await mkdir(absoluteOutputDir, { recursive: true });

  const zip = new AdmZip(absolutePackageFilePath);
  zip.extractAllTo(absoluteOutputDir, true);

  return absoluteOutputDir;
}
