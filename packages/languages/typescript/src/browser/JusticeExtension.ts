import type { SecurityAlert, MediaEvent } from '../types';

export class JusticeExtension {
  private isActive = false;
  private monitoringIntervals: NodeJS.Timeout[] = [];

  async injectProtection(): Promise<void> {
    console.log('Injecting Justice protection into page...');
    
    if (typeof window === 'undefined') {
      console.warn('Browser extension requires browser environment');
      return;
    }

    this.isActive = true;
    
    // Inject protection scripts into social media pages
    await this.injectUploadMonitoring();
    await this.injectRealTimeScanning();
    await this.setupEventListeners();
  }

  async monitorPageActivity(): Promise<void> {
    if (!this.isActive) return;

    // Monitor for file uploads
    const uploadInputs = document.querySelectorAll('input[type="file"]');
    uploadInputs.forEach(input => {
      input.addEventListener('change', this.handleFileUpload.bind(this));
    });

    // Monitor for drag-and-drop uploads
    document.addEventListener('drop', this.handleDragDrop.bind(this));
    
    // Monitor for paste events (images)
    document.addEventListener('paste', this.handlePaste.bind(this));
  }

  async showAlert(alert: SecurityAlert): Promise<void> {
    console.log(`Security Alert [${alert.severity}]: ${alert.suspiciousActivity}`);
    
    if (typeof window !== 'undefined') {
      // Create visual alert in browser
      const alertDiv = document.createElement('div');
      alertDiv.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: ${this.getAlertColor(alert.severity)};
        color: white; padding: 15px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 300px; font-family: Arial, sans-serif;
      `;
      
      alertDiv.innerHTML = `
        <strong>Justice Protection Alert</strong><br>
        <small>${alert.type.replace('_', ' ').toUpperCase()}</small><br>
        ${alert.suspiciousActivity}
        <br><br>
        ${alert.recommendedActions.map(action => `• ${action}`).join('<br>')}
      `;
      
      document.body.appendChild(alertDiv);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (alertDiv.parentNode) {
          alertDiv.parentNode.removeChild(alertDiv);
        }
      }, 10000);
    }
  }

  async destroy(): Promise<void> {
    this.isActive = false;
    this.monitoringIntervals.forEach(clearInterval);
    this.monitoringIntervals = [];
    console.log('Justice Extension destroyed');
  }

  private async injectUploadMonitoring(): Promise<void> {
    // Monitor all upload events on the page
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        const originalFormData = window.FormData;
        window.FormData = function(...args) {
          const instance = new originalFormData(...args);
          console.log('Justice: FormData created, monitoring uploads...');
          return instance;
        };
      })();
    `;
    document.head.appendChild(script);
  }

  private async injectRealTimeScanning(): Promise<void> {
    // Start real-time scanning intervals
    const scanInterval = setInterval(async () => {
      await this.scanForSuspiciousActivity();
    }, 5000); // Scan every 5 seconds
    
    this.monitoringIntervals.push(scanInterval);
  }

  private async setupEventListeners(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Monitor page changes (SPA navigation)
    let lastUrl = window.location.href;
    const urlCheckInterval = setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        this.monitorPageActivity();
      }
    }, 1000);
    
    this.monitoringIntervals.push(urlCheckInterval);
  }

  private async handleFileUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      for (const file of Array.from(input.files)) {
        await this.analyzeUploadedFile(file);
      }
    }
  }

  private async handleDragDrop(event: DragEvent): Promise<void> {
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      event.preventDefault();
      for (const file of Array.from(event.dataTransfer.files)) {
        await this.analyzeUploadedFile(file);
      }
    }
  }

  private async handlePaste(event: ClipboardEvent): Promise<void> {
    if (event.clipboardData && event.clipboardData.files.length > 0) {
      for (const file of Array.from(event.clipboardData.files)) {
        await this.analyzeUploadedFile(file);
      }
    }
  }

  private async analyzeUploadedFile(file: File): Promise<void> {
    console.log(`Justice: Analyzing uploaded file: ${file.name}`);
    
    // Convert file to ArrayBuffer for analysis
    const arrayBuffer = await file.arrayBuffer();
    
    // Here we would integrate with the PreventionAI system
    // For now, just log the analysis
    const suspiciousIndicators = await this.detectSuspiciousContent(arrayBuffer);
    
    if (suspiciousIndicators.length > 0) {
      await this.showAlert({
        alertId: `upload-${Date.now()}`,
        type: 'unauthorized_upload',
        severity: 'high',
        mediaHash: await this.generateFileHash(arrayBuffer),
        suspiciousActivity: `Potentially unauthorized content detected in ${file.name}`,
        recommendedActions: [
          'Verify you have permission to upload this content',
          'Check if this contains someone else\'s identity',
          'Consider the legal implications'
        ],
        autoActionTaken: false,
        timestamp: BigInt(Date.now())
      });
    }
  }

  private async detectSuspiciousContent(data: ArrayBuffer): Promise<string[]> {
    // Placeholder for content analysis
    // Would integrate with AI detection systems
    return [];
  }

  private async generateFileHash(data: ArrayBuffer): Promise<string> {
    // Simple hash generation for file identification
    const bytes = new Uint8Array(data);
    let hash = 0;
    for (let i = 0; i < Math.min(bytes.length, 1000); i++) {
      hash = ((hash << 5) - hash + bytes[i]) & 0xffffffff;
    }
    return Math.abs(hash).toString(16);
  }

  private async scanForSuspiciousActivity(): Promise<void> {
    if (!this.isActive) return;
    
    // Scan page for suspicious elements or activities
    const suspiciousElements = document.querySelectorAll('[data-suspicious], .deepfake-warning');
    if (suspiciousElements.length > 0) {
      console.log(`Justice: Found ${suspiciousElements.length} suspicious elements on page`);
    }
  }

  private getAlertColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
    switch (severity) {
      case 'low': return '#28a745';
      case 'medium': return '#ffc107';
      case 'high': return '#fd7e14';
      case 'critical': return '#dc3545';
      default: return '#6c757d';
    }
  }
}
