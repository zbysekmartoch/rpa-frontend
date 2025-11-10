import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { fetchJSON } from '../lib/fetchJSON.js';

// Komponenta pro podzáložku "Definice analýz"
export default function AnalysisDefinitionTab() {
  const { t } = useLanguage();
  
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileInfo, setSelectedFileInfo] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Rekurzivní funkce pro extrakci všech souborů ze stromu
  const extractFiles = useCallback((items) => {
    const files = [];
    
    const traverse = (nodes) => {
      if (!nodes) return;
      
      for (const node of nodes) {
        if (node.type === 'file') {
          // Zobrazujeme všechny soubory
          files.push(node);
        }
        if (node.type === 'directory' && node.children) {
          traverse(node.children);
        }
      }
    };
    
    traverse(items);
    return files;
  }, []);

  // Načtení seznamu souborů
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchJSON('/api/v1/scripts');
      const filesList = extractFiles(data.items || []);
      setFiles(filesList);
    } catch (error) {
      console.error('Error loading files:', error);
      alert(t('errorLoadingFiles') || 'Chyba při načítání souborů');
    } finally {
      setLoading(false);
    }
  }, [t, extractFiles]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Načtení obsahu souboru
  const loadFileContent = useCallback(async (file) => {
    // Uložíme info o vybraném souboru
    setSelectedFile(file.path);
    setSelectedFileInfo(file);
    setIsEditing(false);
    
    // Zkontroluj, zda je soubor textový
    if (!file.isText) {
      setFileContent('');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/scripts/content?file=${encodeURIComponent(file.path)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setFileContent(data.content || '');
    } catch (error) {
      console.error('Error loading file content:', error);
      alert(t('errorLoadingFileContent') || 'Chyba při načítání obsahu souboru');
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Uložení obsahu souboru
  const saveFileContent = useCallback(async () => {
    if (!selectedFile) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/v1/scripts/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          file: selectedFile,
          content: fileContent
        })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      setIsEditing(false);
      alert(t('fileSaved') || 'Soubor uložen');
    } catch (error) {
      console.error('Error saving file:', error);
      alert(t('errorSavingFile') || 'Chyba při ukládání souboru');
    } finally {
      setLoading(false);
    }
  }, [selectedFile, fileContent, t]);

  // Smazání souboru
  const deleteFile = useCallback(async (filepath) => {
    if (!confirm(t('confirmDeleteFile') || `Opravdu smazat soubor "${filepath}"?`)) return;
    
    try {
      setLoading(true);
      await fetch(`/api/v1/scripts?file=${encodeURIComponent(filepath)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (selectedFile === filepath) {
        setSelectedFile(null);
        setSelectedFileInfo(null);
        setFileContent('');
      }
      
      await loadFiles();
      alert(t('fileDeleted') || 'Soubor smazán');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(t('errorDeletingFile') || 'Chyba při mazání souboru');
    } finally {
      setLoading(false);
    }
  }, [selectedFile, loadFiles, t]);

  // Download souboru
  const downloadFile = useCallback((filepath) => {
    const url = `/api/v1/scripts/download?path=${encodeURIComponent(filepath)}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filepath.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Upload souboru
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    
    
    // Optionally ask for path/folder
    const folder = prompt(t('enterFolderPath') || 'Zadejte cestu ke složce (např. workflows/ nebo prázdné pro root):', '');
    if (folder === null) return; // Cancelled
    
    if (folder) {
      formData.append('targetPath', folder);
    }

    formData.append('file', file);
    try {
      setLoading(true);
      await fetch('/api/v1/scripts/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });
      
      await loadFiles();
      alert(t('fileUploaded') || 'Soubor nahrán');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(t('errorUploadingFile') || 'Chyba při nahrávání souboru');
    } finally {
      setLoading(false);
    }
  }, [loadFiles, t]);

  // Seskupení souborů podle složek
  const groupedFiles = files.reduce((acc, file) => {
    const parts = file.path.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(file);
    return acc;
  }, {});

  return (
    <div style={{ height: '100%', display: 'flex', gap: 12 }}>
      {/* LEFT: File browser */}
      <section
        style={{
          width: 380, minWidth: 320, height: '100%',
          border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, overflow: 'auto', background: '#fff'
        }}
      >
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            {t('files') || 'Soubory'}
          </h3>
          <button
            onClick={() => document.getElementById('file-upload-input')?.click()}
            disabled={loading}
            style={{
              padding: '4px 10px',
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 12
            }}
          >
            + {t('upload') || 'Nahrát'}
          </button>
          <input
            id="file-upload-input"
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>

        {loading && <div style={{ color: '#6b7280', fontSize: 13 }}>{t('loading')}</div>}

        {Object.entries(groupedFiles).map(([folder, folderFiles]) => (
          <div key={folder} style={{ marginBottom: 16 }}>
            <div style={{ 
              fontSize: 12, 
              fontWeight: 600, 
              color: '#374151', 
              marginBottom: 4,
              padding: '4px 0',
              borderBottom: '1px solid #e5e7eb'
            }}>
              📁 {folder}
            </div>
            {folderFiles.map(file => (
              <div
                key={file.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 6,
                  background: selectedFile === file.path ? '#dbeafe' : 'transparent',
                  cursor: 'pointer',
                  marginBottom: 2,
                  fontSize: 13,
                  opacity: file.isText ? 1 : 0.6
                }}
                onClick={() => loadFileContent(file)}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.isText ? '📄' : '📦'} {file.name}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadFile(file.path); }}
                    style={{
                      padding: '2px 6px',
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 11
                    }}
                    title={t('download') || 'Stáhnout'}
                  >
                    ⬇
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteFile(file.path); }}
                    style={{
                      padding: '2px 6px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 11
                    }}
                    title={t('delete') || 'Smazat'}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {files.length === 0 && !loading && (
          <div style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
            {t('noFiles') || 'Žádné soubory'}
          </div>
        )}
      </section>

      {/* RIGHT: File editor */}
      <section
        style={{
          flex: 1, minWidth: 0, height: '100%',
          border: '1px solid #e5e7eb', borderRadius: 12, padding: 10, background: '#fff', display: 'flex', flexDirection: 'column'
        }}
      >
        {selectedFile && selectedFileInfo ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                {selectedFile}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedFileInfo.isText && isEditing ? (
                  <>
                    <button
                      onClick={saveFileContent}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        background: '#22c55e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {t('save') || 'Uložit'}
                    </button>
                    <button
                      onClick={() => { setIsEditing(false); loadFileContent(selectedFileInfo); }}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {t('cancel') || 'Zrušit'}
                    </button>
                  </>
                ) : selectedFileInfo.isText ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                    style={{
                      padding: '6px 12px',
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {t('edit') || 'Upravit'}
                  </button>
                ) : null}
              </div>
            </div>

            {selectedFileInfo.isText ? (
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                readOnly={!isEditing}
                style={{
                  flex: 1,
                  width: '100%',
                  padding: 10,
                  fontFamily: 'monospace',
                  fontSize: 13,
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  resize: 'none',
                  background: isEditing ? '#fff' : '#f9fafb'
                }}
              />
            ) : (
              <div style={{ 
                flex: 1,
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#6b7280',
                gap: 16
              }}>
                <div style={{ fontSize: 64 }}>📦</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {t('binaryFile') || 'Binární soubor'}
                </div>
                <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 400 }}>
                  {t('binaryFileDescription') || 'Tento soubor je binární a nelze jej zobrazit. Můžete jej stáhnout nebo smazat.'}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button
                    onClick={() => downloadFile(selectedFile)}
                    style={{
                      padding: '8px 16px',
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13
                    }}
                  >
                    ⬇ {t('download') || 'Stáhnout'}
                  </button>
                  <button
                    onClick={() => deleteFile(selectedFile)}
                    style={{
                      padding: '8px 16px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13
                    }}
                  >
                    🗑 {t('delete') || 'Smazat'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#6b7280',
            fontSize: 14
          }}>
            {t('selectFileToView') || 'Vyberte soubor pro zobrazení'}
          </div>
        )}
      </section>
    </div>
  );
}
