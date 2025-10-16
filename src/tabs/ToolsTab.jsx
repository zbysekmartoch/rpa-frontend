import React, { useState } from 'react';

export default function ToolsTab() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setUploadStatus('');
      } else {
        alert('Please select a ZIP file');
        event.target.value = '';
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus('Uploading...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/v1/harvest/manual-import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setUploadStatus('✅ Import successful!');
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('manual-import-file');
      if (fileInput) fileInput.value = '';

      console.log('Import result:', result);
    } catch (error) {
      console.error('Import error:', error);
      setUploadStatus('❌ Import failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 600 }}>Data Harvesting Tools</h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
          Utility tools for data harvesting operations
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16,
        marginTop: 16
      }}>
        {/* Manual Import Tool */}
        <div style={{
          padding: 20,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}>
              📥
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Manual Import</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Import data manually</p>
            </div>
          </div>
          
          <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
            Upload a ZIP file containing harvested data to import it into the system.
          </p>

          {/* File Input */}
          <div style={{ marginTop: 8 }}>
            <label 
              htmlFor="manual-import-file"
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 500,
                color: '#374151'
              }}
            >
              Select ZIP file:
            </label>
            <input
              id="manual-import-file"
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              disabled={uploading}
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
            />
            {selectedFile && (
              <div style={{
                marginTop: 8,
                padding: 8,
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 4,
                fontSize: 13,
                color: '#0369a1'
              }}>
                📦 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          {/* Status Message */}
          {uploadStatus && (
            <div style={{
              padding: 10,
              background: uploadStatus.includes('✅') ? '#dcfce7' : uploadStatus.includes('❌') ? '#fee2e2' : '#fef3c7',
              border: `1px solid ${uploadStatus.includes('✅') ? '#bbf7d0' : uploadStatus.includes('❌') ? '#fecaca' : '#fde68a'}`,
              borderRadius: 6,
              fontSize: 13,
              color: uploadStatus.includes('✅') ? '#166534' : uploadStatus.includes('❌') ? '#991b1b' : '#92400e'
            }}>
              {uploadStatus}
            </div>
          )}
          
          <button
            onClick={handleImport}
            disabled={!selectedFile || uploading}
            style={{
              padding: '10px 16px',
              background: (!selectedFile || uploading) ? '#9ca3af' : '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: (!selectedFile || uploading) ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: 14,
              marginTop: 'auto'
            }}
          >
            {uploading ? 'Importing...' : 'Import Data'}
          </button>
        </div>

        {/* Placeholder for future tools */}
        <div style={{
          padding: 20,
          border: '1px dashed #d1d5db',
          borderRadius: 12,
          background: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          color: '#9ca3af'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔧</div>
            <div style={{ fontSize: 14 }}>More tools coming soon...</div>
          </div>
        </div>
      </div>
    </div>
  );
}
