// Fixes React 19 + react-i18next type incompatibility.
// ReactI18NextChildren uses a conditional type (ObjectOrNever) that TypeScript
// can't simplify without knowing allowObjectInHTMLChildren, causing ReactNode
// to appear unassignable to ReactI18NextChildren in HTMLAttributes.children.
// export {} makes this a module so the block below AUGMENTS i18next instead of replacing it.
export {}

declare module 'i18next' {
  interface TypeOptions {
    allowObjectInHTMLChildren: false
  }
}
