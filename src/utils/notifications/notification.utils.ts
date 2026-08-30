export function replaceTemplateVariables(
  templateStr: string,
  variables: Record<string, string | number> = {}
): string {
  let result = templateStr;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, String(value ?? ''));
  });
  return result;
}
