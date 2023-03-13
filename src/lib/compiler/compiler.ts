import { DeclarativeWebComponent, DeclarativeWebComponentOutputType, DoubleUCCompilerFunction } from '../../types.js';
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
import { replaceAttributeChangedCallback } from './steps/replaceAttributeChangedCallback.js';
import { format } from './steps/format.js';
import { treeShaking } from './steps/treeShaking.js';
import { minify } from './steps/minify.js';
import { output } from './steps/output.js';
import { replaceCallbacks } from './steps/replaceCallbacks.js';

export const DoubleUCCompiler: DoubleUCCompilerFunction = async (
  declaration: DeclarativeWebComponent,
  outputType: DeclarativeWebComponentOutputType = DeclarativeWebComponentOutputType.FILE
) => {
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
    const replacedConnectedCallback = replaceCallbacks('{{CONNECTED_CALLBACKS}}', replacedObservedAttributes, declaration.hooks?.connected);
    const replacedDisconnectedCallback = replaceCallbacks('{{DISCONNECTED_CALLBACKS}}', replacedConnectedCallback, declaration.hooks?.disconnected);
    const replacedAdoptedCallback = replaceCallbacks('{{ADOPTED_CALLBACKS}}', replacedDisconnectedCallback, declaration.hooks?.adopted);
    const replacedAttributeChangedCallback = replaceAttributeChangedCallback(replacedAdoptedCallback, declaration.hooks?.attributeChanged);
    const replacedBeforeFirstRenderHook = replaceCallbacks('{{BEFORE_FIRST_RENDER_HOOK}}', replacedAttributeChangedCallback, declaration.hooks?.beforeFirstRendered);
    const replacedAfterFirstRenderHook = replaceCallbacks('{{AFTER_FIRST_RENDER_HOOK}}', replacedBeforeFirstRenderHook, declaration.hooks?.firstRendered);
    const replacedBeforeRenderHook = replaceCallbacks('{{BEFORE_RENDER_HOOK}}', replacedAfterFirstRenderHook, declaration.hooks?.beforeRendered);
    const replacedAfterRenderHook = replaceCallbacks('{{AFTER_RENDER_HOOK}}', replacedBeforeRenderHook, declaration.hooks?.rendered);
    const formatted = format(className, replacedAfterRenderHook);
    const treeShaken = treeShaking(declaration, formatted);
    const formattedAgain = format(className, treeShaken);
    const minified = await minify(className, formattedAgain, declaration.config);
    return output(outputType, tagName, className, minified, declaration.config);
  } catch (e) {
    console.error(`\n [${className}] - failed to build component ${tagName} ${(e as Error).message}`);
  }
};
