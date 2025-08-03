import { DefaultLogger, loadIAMConfig } from '../src/core/logger';
import fs from 'fs';

describe('DefaultLogger', () => {
  it('should log at info level and above by default', () => {
    const logger = new DefaultLogger('info');
    const spyInfo = jest.spyOn(console, 'info').mockImplementation(() => {});
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const spyDebug = jest.spyOn(console, 'debug').mockImplementation(() => {});
    logger.info('info');
    logger.warn('warn');
    logger.error('error');
    logger.debug('debug');
    expect(spyInfo).toHaveBeenCalledWith('[IAM][INFO]', 'info');
    expect(spyWarn).toHaveBeenCalledWith('[IAM][WARN]', 'warn');
    expect(spyError).toHaveBeenCalledWith('[IAM][ERROR]', 'error');
    expect(spyDebug).not.toHaveBeenCalled();
    spyInfo.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
    spyDebug.mockRestore();
  });

  it('should log only error at error level', () => {
    const logger = new DefaultLogger('error');
    const spyInfo = jest.spyOn(console, 'info').mockImplementation(() => {});
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
    logger.info('info');
    logger.warn('warn');
    logger.error('error');
    expect(spyInfo).not.toHaveBeenCalled();
    expect(spyWarn).not.toHaveBeenCalled();
    expect(spyError).toHaveBeenCalledWith('[IAM][ERROR]', 'error');
    spyInfo.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
  });

  it('should log nothing at none level', () => {
    const logger = new DefaultLogger('none');
    const spyInfo = jest.spyOn(console, 'info').mockImplementation(() => {});
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const spyDebug = jest.spyOn(console, 'debug').mockImplementation(() => {});
    logger.info('info');
    logger.warn('warn');
    logger.error('error');
    logger.debug('debug');
    expect(spyInfo).not.toHaveBeenCalled();
    expect(spyWarn).not.toHaveBeenCalled();
    expect(spyError).not.toHaveBeenCalled();
    expect(spyDebug).not.toHaveBeenCalled();
    spyInfo.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
    spyDebug.mockRestore();
  });

  it('should log all at debug level', () => {
    const logger = new DefaultLogger('debug');
    const spyInfo = jest.spyOn(console, 'info').mockImplementation(() => {});
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const spyDebug = jest.spyOn(console, 'debug').mockImplementation(() => {});
    logger.info('info');
    logger.warn('warn');
    logger.error('error');
    logger.debug('debug');
    expect(spyInfo).toHaveBeenCalledWith('[IAM][INFO]', 'info');
    expect(spyWarn).toHaveBeenCalledWith('[IAM][WARN]', 'warn');
    expect(spyError).toHaveBeenCalledWith('[IAM][ERROR]', 'error');
    expect(spyDebug).toHaveBeenCalledWith('[IAM][DEBUG]', 'debug');
    spyInfo.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
    spyDebug.mockRestore();
  });
});

describe('loadIAMConfig', () => {
  it('should load logLevel from process.env', () => {
    process.env.IAM_LOG_LEVEL = 'warn';
    const config = loadIAMConfig();
    expect(config.logLevel).toBe('warn');
    delete process.env.IAM_LOG_LEVEL;
  });

  it('should load logLevel from file', () => {
    const tmpFile = './tmp-iam-config.json';
    fs.writeFileSync(tmpFile, JSON.stringify({ logLevel: 'error' }));
    const config = loadIAMConfig({ file: tmpFile });
    expect(config.logLevel).toBe('error');
    fs.unlinkSync(tmpFile);
  });

  it('should load from env option', () => {
    const config = loadIAMConfig({ env: { logLevel: 'debug' } });
    expect(config.logLevel).toBe('debug');
  });

  it('should load logLevel from YAML file', () => {
    const tmpFile = './tmp-iam-config.yaml';
    fs.writeFileSync(tmpFile, 'logLevel: info');
    const config = loadIAMConfig({ file: tmpFile });
    expect(config.logLevel).toBe('info');
    fs.unlinkSync(tmpFile);
  });

  it('should load logLevel from .env file', () => {
    const tmpFile = './tmp-iam-config.env';
    fs.writeFileSync(tmpFile, 'IAM_LOG_LEVEL=warn');
    const config = loadIAMConfig({ file: tmpFile });
    expect(config.logLevel).toBe('warn');
    fs.unlinkSync(tmpFile);
  });
});
