// A small JSON Schema (draft 2020-12) validator for planning.schema.json.
//
// It implements the keywords that schema uses — type, const, enum, required,
// properties, additionalProperties, items, $ref (local), oneOf, anyOf, allOf,
// pattern, minimum, and format "date-time" — so validation needs no package
// and no network. An unsupported keyword fails loudly instead of passing.

export interface SchemaError {
  /** JSON Pointer of the failing value, `""` for the document. */
  path: string;
  message: string;
}

type Schema = Record<string, any> | boolean;

const IGNORED = new Set(["$schema", "$id", "$defs", "$comment", "title", "description", "default", "examples", "deprecated", "readOnly", "writeOnly"]);
const SUPPORTED = new Set(["type", "const", "enum", "required", "properties", "additionalProperties", "items", "$ref", "oneOf", "anyOf", "allOf", "pattern", "minimum", "format"]);

// RFC 3339 date-time, as pm-export writes it (seconds, offset or Z).
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}

const matchesType = (value: unknown, type: string) => {
  const actual = typeOf(value);
  return actual === type || (type === "number" && actual === "integer");
};

const show = (value: unknown) => JSON.stringify(value);
const pointer = (path: string, key: string | number) => `${path}/${String(key).replace(/~/g, "~0").replace(/\//g, "~1")}`;

export function validate(document: unknown, root: Record<string, any>): SchemaError[] {
  const errors: SchemaError[] = [];

  const resolve = (ref: string): Schema => {
    if (!ref.startsWith("#/")) throw new Error(`schema: only local $ref is supported (${ref})`);
    let node: any = root;
    for (const part of ref.slice(2).split("/")) {
      node = node?.[part.replace(/~1/g, "/").replace(/~0/g, "~")];
      if (node === undefined) throw new Error(`schema: unresolved $ref ${ref}`);
    }
    return node;
  };

  // Returns the errors for one value; the caller decides whether to keep them (oneOf, anyOf).
  const check = (value: unknown, schema: Schema, path: string): SchemaError[] => {
    if (schema === true) return [];
    if (schema === false) return [{ path, message: "is not allowed" }];
    const out: SchemaError[] = [];
    const add = (message: string, at = path) => out.push({ path: at, message });

    for (const keyword of Object.keys(schema)) {
      if (!SUPPORTED.has(keyword) && !IGNORED.has(keyword)) throw new Error(`schema: unsupported keyword "${keyword}" at ${path || "/"}`);
    }

    if (schema.$ref) out.push(...check(value, resolve(schema.$ref), path));

    if (schema.type !== undefined) {
      const types: string[] = Array.isArray(schema.type) ? schema.type : [schema.type];
      if (!types.some((type) => matchesType(value, type))) {
        add(`must be ${types.join(" or ")} (got ${typeOf(value)})`);
        return out;
      }
    }
    if ("const" in schema && show(value) !== show(schema.const)) add(`must be ${show(schema.const)} (got ${show(value)})`);
    if (schema.enum && !schema.enum.some((option: unknown) => show(option) === show(value))) {
      add(`must be one of ${schema.enum.map(show).join(", ")} (got ${show(value)})`);
    }
    if (typeof value === "string") {
      if (schema.pattern && !new RegExp(schema.pattern, "u").test(value)) add(`must match ${schema.pattern} (got ${show(value)})`);
      if (schema.format === "date-time" && !DATE_TIME.test(value)) add(`must be an RFC 3339 date-time (got ${show(value)})`);
    }
    if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) add(`must be at least ${schema.minimum} (got ${value})`);

    if (typeOf(value) === "object") {
      const object = value as Record<string, unknown>;
      for (const key of schema.required ?? []) if (!(key in object)) add(`is missing required key "${key}"`);
      const properties: Record<string, Schema> = schema.properties ?? {};
      for (const [key, child] of Object.entries(object)) {
        if (key in properties) out.push(...check(child, properties[key]!, pointer(path, key)));
        else if (schema.additionalProperties === false) add(`has a key the schema does not allow: "${key}"`);
        else if (typeof schema.additionalProperties === "object") out.push(...check(child, schema.additionalProperties, pointer(path, key)));
      }
    }
    if (Array.isArray(value) && schema.items !== undefined) {
      value.forEach((child, index) => out.push(...check(child, schema.items, pointer(path, index))));
    }

    if (schema.allOf) for (const part of schema.allOf) out.push(...check(value, part, path));
    if (schema.anyOf && !schema.anyOf.some((part: Schema) => check(value, part, path).length === 0)) {
      add(`matches none of the anyOf options (got ${show(value)})`);
    }
    if (schema.oneOf) {
      const results = schema.oneOf.map((part: Schema) => check(value, part, path));
      const passing = results.filter((result: SchemaError[]) => result.length === 0).length;
      if (passing !== 1) {
        // With one option nearly right, its errors say more than "matches none".
        const closest = results.reduce((best: SchemaError[], result: SchemaError[]) => (result.length < best.length ? result : best));
        if (passing === 0 && closest.length && closest[0]!.path !== path) out.push(...closest);
        else add(passing === 0 ? `matches none of the oneOf options (got ${show(value)})` : `matches ${passing} oneOf options; exactly one is allowed`);
      }
    }
    return out;
  };

  errors.push(...check(document, root, ""));
  return errors;
}

/** One line per error: `/roadmap/next/0/size: must be one of "S", "M", "L" (got "XL")`. */
export const formatErrors = (errors: SchemaError[]) => errors.map((error) => `${error.path || "/"}: ${error.message}`);
