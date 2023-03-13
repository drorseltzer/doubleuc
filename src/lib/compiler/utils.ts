import fs from 'fs';
import { DeclarativeWebComponentCompilerLog, DeclarativeWebComponentCompilerLogType } from '../../types.js';

export const kebabToPascal = (str: string) => {
  try {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  } catch (e) {
    throw new Error(`cannot kebabToPascal ${str}`);
  }
};

export const pascalToKebab = (str: string) => {
  try {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  } catch (e) {
    throw new Error(`cannot pascalToKebab ${str}`);
  }
};

export const fileExist = (filePath: string) => {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (e) {
    return false;
  }
};

export const createLogger = <T = unknown>() => {
  const logs: Array<T> = [];
  return {
    log: (logData: T) => {
      logs.push(logData);
    },
    getLogs: () => {
      return logs;
    }
  };
};

export const createSuccessLog = (name: string, output: string): DeclarativeWebComponentCompilerLog => {
  return {
    step: name,
    type: DeclarativeWebComponentCompilerLogType.OK,
    output
  };
};

export const createErrorLog = (name: string, error: Error): DeclarativeWebComponentCompilerLog => {
  return {
    step: name,
    type: DeclarativeWebComponentCompilerLogType.ERROR,
    output: error
  };
};

export const runCompilerStep = async (
  stepName: string,
  func: (...args: Array<any>) => string | Promise<string>,
  wcString: string,
  loggerCallback: (log: DeclarativeWebComponentCompilerLog) => void
) => {
  try {
    const output = await func();
    loggerCallback(createSuccessLog(stepName, output));
    return output;
  } catch (e) {
    loggerCallback(createErrorLog(stepName, e as Error));
    return wcString.toString();
  }
};
