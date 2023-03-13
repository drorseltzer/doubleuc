import {
  DeclarativeWebComponent,
  DeclarativeWebComponentCompilerLog,
  DeclarativeWebComponentCompilerLogType,
  DeclarativeWebComponentOutputType,
  DoubleUCCompilerFunction
} from '../../types.js';
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
import { createLogger, runCompilerStep } from './utils.js';

export const DoubleUCCompiler: DoubleUCCompilerFunction = async (
  declaration: DeclarativeWebComponent,
  outputType: DeclarativeWebComponentOutputType = DeclarativeWebComponentOutputType.FILE
) => {
  const logger = createLogger<DeclarativeWebComponentCompilerLog>();

  const tagName = await runCompilerStep(
    'tagName',
    () => declaration.tagName,
    '',
    log => logger.log(log)
  );

  const className = await runCompilerStep(
    'className',
    () => setClassName(tagName),
    '',
    log => logger.log(log)
  );

  const templateFile = await runCompilerStep(
    'templateFile',
    () => getTemplateFile(),
    '',
    log => logger.log(log)
  );

  const replacedClassName = await runCompilerStep(
    'replacedClassName',
    () => replaceClassName(className, tagName, templateFile),
    templateFile,
    log => logger.log(log)
  );

  const replacedTagName = await runCompilerStep(
    'replacedTagName',
    () => replaceTagName(className, tagName, replacedClassName),
    replacedClassName,
    log => logger.log(log)
  );

  const replacedTemplateHtml = await runCompilerStep(
    'replacedTemplateHtml',
    () => replaceTemplateHtml(declaration, replacedTagName),
    replacedTagName,
    log => logger.log(log)
  );

  const replacedStyle = await runCompilerStep(
    'replacedStyle',
    () => replaceStyle(declaration, className, replacedTemplateHtml),
    replacedTemplateHtml,
    log => logger.log(log)
  );

  const replacedGetters = await runCompilerStep(
    'replacedGetters',
    () => replaceGetters(declaration.attributes, replacedStyle),
    replacedStyle,
    log => logger.log(log)
  );

  const replacedMethods = await runCompilerStep(
    'replacedMethods',
    () => replaceMethods(replacedGetters, declaration.methods),
    replacedGetters,
    log => logger.log(log)
  );

  const replacedAttributesInits = await runCompilerStep(
    'replacedAttributesInits',
    () => replaceAttributesInits(declaration.attributes, replacedMethods),
    replacedMethods,
    log => logger.log(log)
  );

  const replacedListenersInits = await runCompilerStep(
    'replacedListenersInits',
    () => replaceListenersInits(replacedAttributesInits, declaration.listeners),
    replacedAttributesInits,
    log => logger.log(log)
  );

  const replacedObservedAttributes = await runCompilerStep(
    'replacedObservedAttributes',
    () => replaceObservedAttributes(declaration.attributes, replacedListenersInits),
    replacedListenersInits,
    log => logger.log(log)
  );

  const replacedConnectedCallback = await runCompilerStep(
    'replacedConnectedCallback',
    () => replaceCallbacks('{{CONNECTED_CALLBACKS}}', replacedObservedAttributes, declaration.hooks?.connected),
    replacedObservedAttributes,
    log => logger.log(log)
  );

  const replacedDisconnectedCallback = await runCompilerStep(
    'replacedDisconnectedCallback',
    () => replaceCallbacks('{{DISCONNECTED_CALLBACKS}}', replacedConnectedCallback, declaration.hooks?.disconnected),
    replacedConnectedCallback,
    log => logger.log(log)
  );

  const replacedAdoptedCallback = await runCompilerStep(
    'replacedAdoptedCallback',
    () => replaceCallbacks('{{ADOPTED_CALLBACKS}}', replacedDisconnectedCallback, declaration.hooks?.adopted),
    replacedDisconnectedCallback,
    log => logger.log(log)
  );

  const replacedAttributeChangedCallback = await runCompilerStep(
    'replacedAttributeChangedCallback',
    () => replaceAttributeChangedCallback(replacedAdoptedCallback, declaration.hooks?.attributeChanged),
    replacedAdoptedCallback,
    log => logger.log(log)
  );

  const replacedBeforeFirstRenderHook = await runCompilerStep(
    'replacedBeforeFirstRenderHook',
    () => replaceCallbacks('{{BEFORE_FIRST_RENDER_HOOK}}', replacedAttributeChangedCallback, declaration.hooks?.beforeFirstRendered),
    replacedAttributeChangedCallback,
    log => logger.log(log)
  );

  const replacedAfterFirstRenderHook = await runCompilerStep(
    'replacedAfterFirstRenderHook',
    () => replaceCallbacks('{{AFTER_FIRST_RENDER_HOOK}}', replacedBeforeFirstRenderHook, declaration.hooks?.firstRendered),
    replacedBeforeFirstRenderHook,
    log => logger.log(log)
  );

  const replacedBeforeRenderHook = await runCompilerStep(
    'replacedBeforeRenderHook',
    () => replaceCallbacks('{{BEFORE_RENDER_HOOK}}', replacedAfterFirstRenderHook, declaration.hooks?.beforeRendered),
    replacedAfterFirstRenderHook,
    log => logger.log(log)
  );

  const replacedAfterRenderHook = await runCompilerStep(
    'replacedAfterRenderHook',
    () => replaceCallbacks('{{AFTER_RENDER_HOOK}}', replacedBeforeRenderHook, declaration.hooks?.rendered),
    replacedBeforeRenderHook,
    log => logger.log(log)
  );

  const formatted = await runCompilerStep(
    'formatted',
    () => format(className, replacedAfterRenderHook),
    replacedAfterRenderHook,
    log => logger.log(log)
  );

  const treeShaken = await runCompilerStep(
    'treeShaken',
    () => treeShaking(declaration, formatted),
    formatted,
    log => logger.log(log)
  );

  const formattedAgain = await runCompilerStep(
    'formattedAgain',
    () => format(className, treeShaken),
    treeShaken,
    log => logger.log(log)
  );

  const minified = await runCompilerStep(
    'minified',
    async () => await minify(className, formattedAgain, declaration.config),
    formattedAgain,
    log => logger.log(log)
  );

  if (process.env.DEBUG) {
    console.debug(`Debugging ${tagName}:`);
    console.table(
      logger.getLogs().map(log => {
        const { step, type } = log;
        return {
          step,
          type: type === DeclarativeWebComponentCompilerLogType.OK ? 'PASS' : 'FAILED'
        };
      })
    );
  }

  const isExceptions = logger.getLogs().filter(log => log.type === DeclarativeWebComponentCompilerLogType.ERROR);
  if (isExceptions.length > 0) {
    const mapFn = (log: DeclarativeWebComponentCompilerLog) => {
      return `[${log.step.toUpperCase()}] - ${(log.output as Error).name}: ${(log.output as Error).message}`;
    };
    throw new Error(`Failed to compile component ${tagName}, fix these error and run again:\n${isExceptions.map(mapFn).join('\n')}`);
  }

  return await runCompilerStep(
    'output',
    () => output(outputType, tagName, className, minified, declaration.config),
    minified,
    log => logger.log(log)
  );
};
