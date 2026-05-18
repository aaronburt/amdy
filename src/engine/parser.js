function get(obj, path) {
  return path.split('.').reduce((acc, part) => {
    return acc && acc[part] !== undefined ? acc[part] : undefined;
  }, obj);
}

export function interpolate(template, variables) {
  if (typeof template === 'string') {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      return variables[trimmedKey] !== undefined ? String(variables[trimmedKey]) : match;
    });
  }
  if (Array.isArray(template)) {
    return template.map(item => interpolate(item, variables));
  }
  if (typeof template === 'object' && template !== null) {
    const result = {};
    for (const [k, v] of Object.entries(template)) {
      result[k] = interpolate(v, variables);
    }
    return result;
  }
  return template;
}

export function extractVariables(sourceData, mappings) {
  const variables = {};
  for (const [varName, path] of Object.entries(mappings)) {
    variables[varName] = get(sourceData, path);
  }
  return variables;
}
