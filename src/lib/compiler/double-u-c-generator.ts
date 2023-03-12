import { DeclarativeWebComponent, DeclarativeWebComponentOutputType } from '../../types.js';
import { setClassName } from './steps/setClassName.js';
import { getTemplateFile } from './steps/getTemplateFile.js';
import { replaceClassName } from './steps/replaceClassName.js';
import { replaceTagName } from './steps/replaceTagName.js';
import { replaceTemplateHtml } from './steps/replaceTemplateHtml.js';
import { replaceStyle } from './steps/replaceStyle.js';
import { replaceGetters } from './steps/replaceGetters.js';
import { replaceMethods } from './steps/replaceMethods.js';
import { replaceAttributesInits } from './steps/replaceAttributesInits.js';
import { replaceListenersInits } from './steps/replaceListenersInits.js';
import { replaceObservedAttributes } from './steps/replaceObservedAttributes.js';
import { replaceConnectedCallback } from './steps/replaceConnectedCallback.js';
import { replaceDisconnectedCallback } from './steps/replaceDisconnectedCallback.js';
import { replaceAdoptedCallback } from './steps/replaceAdoptedCallback.js';
import { replaceAttributeChangedCallback } from './steps/replaceAttributeChangedCallback.js';
import { replaceBeforeFirstRenderHook } from './steps/replaceBeforeFirstRenderHook.js';
import { replaceAfterFirstRenderHook } from './steps/replaceAfterFirstRenderHook.js';
import { replaceBeforeRenderHook } from './steps/replaceBeforeRenderHook.js';
import { replaceAfterRenderHook } from './steps/replaceAfterRenderHook.js';
import { format } from './steps/format.js';
import { treeShaking } from './steps/treeShaking.js';
import { minify } from './steps/minify.js';
import { output } from './steps/output.js';

export const DoubleUCGenerator = async (declaration: DeclarativeWebComponent, outputType: DeclarativeWebComponentOutputType = DeclarativeWebComponentOutputType.FILE) => {
  const { tagName } = declaration;
  const className = setClassName(tagName);
  try {
    const templateFile = getTemplateFile(className);
    const replacedClassName = replaceClassName(className, tagName, templateFile);
    const replacedTagName = replaceTagName(className, tagName, replacedClassName);
    const replacedTemplateHtml = replaceTemplateHtml(declaration, replacedTagName);
    const replacedStyle = replaceStyle(declaration, className, replacedTemplateHtml);
    const replacedGetters = replaceGetters(declaration.attributes, replacedStyle);
    const replacedMethods = replaceMethods(replacedGetters, declaration.methods);
    const replacedAttributesInits = replaceAttributesInits(declaration.attributes, replacedMethods);
    const replacedListenersInits = replaceListenersInits(replacedAttributesInits, declaration.listeners);
    const replacedObservedAttributes = replaceObservedAttributes(declaration.attributes, replacedListenersInits);
    const replacedConnectedCallback = replaceConnectedCallback(replacedObservedAttributes, declaration.hooks?.connected);
    const replacedDisconnectedCallback = replaceDisconnectedCallback(replacedConnectedCallback, declaration.hooks?.disconnected);
    const replacedAdoptedCallback = replaceAdoptedCallback(replacedDisconnectedCallback, declaration.hooks?.adopted);
    const replacedAttributeChangedCallback = replaceAttributeChangedCallback(replacedAdoptedCallback, declaration.hooks?.attributeChanged);
    const replacedBeforeFirstRenderHook = replaceBeforeFirstRenderHook(replacedAttributeChangedCallback, declaration.hooks?.beforeFirstRendered);
    const replacedAfterFirstRenderHook = replaceAfterFirstRenderHook(replacedBeforeFirstRenderHook, declaration.hooks?.firstRendered);
    const replacedBeforeRenderHook = replaceBeforeRenderHook(replacedAfterFirstRenderHook, declaration.hooks?.beforeRendered);
    const replacedAfterRenderHook = replaceAfterRenderHook(replacedBeforeRenderHook, declaration.hooks?.rendered);
    const formatted = format(className, replacedAfterRenderHook);
    const treeShaken = treeShaking(declaration, formatted);
    const formattedAgain = format(className, treeShaken);
    const minified = await minify(className, formattedAgain, declaration.config);
    return output(outputType, tagName, className, minified, declaration.config);
  } catch (e) {
    console.error(`\n [${className}] - failed to build component ${tagName} ${(e as Error).message}`);
  }
};
