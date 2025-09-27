/**
 * Diagnostic utilities for ONNX Runtime Web
 */

export interface DiagnosticResult {
  webAssemblySupported: boolean;
  webGLSupported: boolean;
  webGPUSupported: boolean;
  onnxRuntimeLoaded: boolean;
  modelFileExists: boolean;
  wasmFilesAvailable: boolean;
  memoryInfo: {
    totalJSHeapSize?: number;
    usedJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
  errors: string[];
}

interface PerformanceMemory {
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

export class DiagnosticService {
  /**
   * Run comprehensive diagnostics for ONNX Runtime Web
   */
  static async runDiagnostics(): Promise<DiagnosticResult> {
    const result: DiagnosticResult = {
      webAssemblySupported: false,
      webGLSupported: false,
      webGPUSupported: false,
      onnxRuntimeLoaded: false,
      modelFileExists: false,
      wasmFilesAvailable: false,
      memoryInfo: {},
      errors: []
    };

    try {
      // Check WebAssembly support
      result.webAssemblySupported = typeof WebAssembly !== 'undefined';
      if (!result.webAssemblySupported) {
        result.errors.push('WebAssembly is not supported in this browser');
      }

      // Check WebGL support
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        result.webGLSupported = !!gl;
        if (!result.webGLSupported) {
          result.errors.push('WebGL is not supported');
        }
      } catch {
        result.webGLSupported = false;
        result.errors.push('WebGL initialization failed');
      }

      // Check WebGPU support
      try {
        result.webGPUSupported = 'gpu' in navigator;
      } catch {
        result.webGPUSupported = false;
      }

      // Check ONNX Runtime Web
      try {
        await import('onnxruntime-web');
        result.onnxRuntimeLoaded = true;
        console.log('ONNX Runtime Web loaded successfully');
      } catch (error) {
        result.onnxRuntimeLoaded = false;
        result.errors.push(`ONNX Runtime Web import failed: ${error}`);
      }

      // Check model file
      try {
        const response = await fetch('/models/model_fp16.onnx', { method: 'HEAD' });
        result.modelFileExists = response.ok;
        if (!response.ok) {
          result.errors.push(`Model file not found: ${response.status}`);
        }
      } catch (error) {
        result.errors.push(`Model file check failed: ${error}`);
      }

      // Check WASM files
      try {
        const response = await fetch('/wasm/ort-wasm-simd.wasm', { method: 'HEAD' });
        result.wasmFilesAvailable = response.ok;
        if (!response.ok) {
          result.errors.push('Local WASM files not found, will use CDN');
        }
      } catch (error) {
        result.wasmFilesAvailable = false;
        result.errors.push(`WASM files check failed: ${error}`);
      }

      // Check memory info
      try {
        const perf = performance as PerformanceWithMemory;
        if (perf.memory) {
          result.memoryInfo = {
            totalJSHeapSize: perf.memory.totalJSHeapSize,
            usedJSHeapSize: perf.memory.usedJSHeapSize,
            jsHeapSizeLimit: perf.memory.jsHeapSizeLimit
          };
        }
      } catch (error) {
        result.errors.push(`Memory info check failed: ${error}`);
      }

    } catch (error) {
      result.errors.push(`General diagnostic error: ${error}`);
    }

    return result;
  }

  /**
   * Print diagnostic results to console
   */
  static printDiagnostics(result: DiagnosticResult): void {
    console.group('🔍 ONNX Runtime Web Diagnostics');
    console.log('WebAssembly:', result.webAssemblySupported ? '✅' : '❌');
    console.log('WebGL:', result.webGLSupported ? '✅' : '❌');
    console.log('WebGPU:', result.webGPUSupported ? '✅' : '❌');
    console.log('ONNX Runtime:', result.onnxRuntimeLoaded ? '✅' : '❌');
    console.log('Model File:', result.modelFileExists ? '✅' : '❌');
    console.log('WASM Files:', result.wasmFilesAvailable ? '✅' : '❌');
    
    if (result.memoryInfo.usedJSHeapSize) {
      console.log('Memory Usage:', `${(result.memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    }

    if (result.errors.length > 0) {
      console.group('❌ Errors');
      result.errors.forEach(error => console.error(error));
      console.groupEnd();
    }
    console.groupEnd();
  }
}
