/**
 * Analysis Definition Tab
 * Script file browser and Monaco editor for viewing/editing analysis scripts
 */
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { fetchJSON } from '../lib/fetchJSON.js';
import Editor from '@monaco-editor/react';

// Map file extensions to Monaco Editor languages
const getLanguageFromFilename = (filename) => {
  if (!filename) return 'plaintext';
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap = {
    'py': 'python',
    'python': 'python',
    'js': 'javascript',
    'jsx': 'javascript',
    'cjs': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'json': 'json',
    'sql': 'sql',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'md': 'markdown',
    'markdown': 'markdown',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'sh': 'shell',
    'bash': 'shell',
    'txt': 'plaintext',
    'log': 'plaintext',
    'csv': 'plaintext',
  };
  return languageMap[ext] || 'plaintext';
};

// Component for "Analysis Definition" sub-tab
export default function AnalysisDefinitionTab() {
  const { t } = useLanguage();
  
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileInfo, setSelectedFileInfo] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editorTheme, setEditorTheme] = useState(() => 
    localStorage.getItem('monacoTheme') || 'vs-dark'
  );
  const [dragOverFolder, setDragOverFolder] = useState(null);

  // Available Monaco Editor themes
  const availableThemes = [
    { value: 'vs', label: 'Light' },
    { value: 'vs-dark', label: 'Dark' },
    { value: 'hc-black', label: 'High Contrast' },
  ];

  // Save theme to localStorage
  const handleThemeChange = useCallback((theme) => {
    setEditorTheme(theme);
    localStorage.setItem('monacoTheme', theme);
  }, []);

  // Open editor in new window
  const openInNewWindow = useCallback(() => {
    if (!selectedFile || !selectedFileInfo?.isText) return;
    
    const newWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!newWindow) {
      alert(t('popupBlocked') || 'Povolit vyskakovací okna pro tuto stránku');
      return;
    }
    
    // HTML content for new window with Monaco Editor
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${selectedFile} - Editor</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; }
    #container { height: 100vh; display: flex; flex-direction: column; }
    #toolbar { padding: 8px 12px; background: #1e1e1e; border-bottom: 1px solid #333; display: flex; gap: 12px; align-items: center; }
    #toolbar span { color: #ccc; font-size: 13px; }
    #toolbar select { padding: 4px 8px; border-radius: 4px; border: 1px solid #555; background: #333; color: #fff; }
    #toolbar button { padding: 6px 12px; border-radius: 4px; border: none; cursor: pointer; font-size: 12px; }
    #toolbar button.save { background: #22c55e; color: #fff; }
    #toolbar button.close { background: #6b7280; color: #fff; }
    #editor { flex: 1; }
    .badge { background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div id="container">
    <div id="toolbar">
      <span>📄 ${selectedFile}</span>
      <span class="badge">${getLanguageFromFilename(selectedFile)}</span>
      <select id="themeSelect">
        <option value="vs">Light</option>
        <option value="vs-dark" selected>Dark</option>
        <option value="hc-black">High Contrast</option>
      </select>
      <button class="save" id="saveBtn">💾 Save</button>
      <button class="close" onclick="window.close()">✕ Close</button>
    </div>
    <div id="editor"></div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"><` + `/script>
  <script>
    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
    require(['vs/editor/editor.main'], function() {
      const editor = monaco.editor.create(document.getElementById('editor'), {
        value: ${JSON.stringify(fileContent)},
        language: '${getLanguageFromFilename(selectedFile)}',
        theme: 'vs-dark',
        fontSize: 13,
        minimap: { enabled: true },
        automaticLayout: true,
        wordWrap: 'on',
        tabSize: 2
      });
      
      document.getElementById('themeSelect').addEventListener('change', (e) => {
        monaco.editor.setTheme(e.target.value);
      });
      
      document.getElementById('saveBtn').addEventListener('click', async () => {
        try {
          const response = await fetch('/api/v1/scripts/content', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ${localStorage.getItem('authToken')}'
            },
            body: JSON.stringify({
              file: '${selectedFile}',
              content: editor.getValue()
            })
          });
          if (!response.ok) throw new Error('Save failed');
          alert('Soubor uložen!');
        } catch (e) {
          alert('Chyba při ukládání: ' + e.message);
        }
      });
      
      window.addEventListener('beforeunload', (e) => {
        // Warning before closing
      });
    });
  <` + `/script>
</body>
</html>
    `;
    
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  }, [selectedFile, selectedFileInfo, fileContent, t]);

  // Recursive function to extract all files from the tree
  const extractFiles = useCallback((items) => {
    const files = [];
    
    const traverse = (nodes) => {
      if (!nodes) return;
      
      for (const node of nodes) {
        if (node.type === 'file') {
          // Display all files
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

  // Load file list
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

  // Load file content
  const loadFileContent = useCallback(async (file) => {
    // Save selected file info
    setSelectedFile(file.path);
    setSelectedFileInfo(file);
    setIsEditing(false);
    
    // Check if file is text-based
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

  // Save file content
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

  // Delete file
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

  // Download file
  const downloadFile = useCallback((filepath) => {
    const url = `/api/v1/scripts/download?file=${encodeURIComponent(filepath)}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filepath.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Upload file
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

  // Drag & Drop upload to folder
  const handleDrop = useCallback(async (e, targetFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);
    
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    
    for (const file of files) {
      const formData = new FormData();
      // Set target folder
      if (targetFolder && targetFolder !== 'root') {
        formData.append('targetPath', targetFolder);
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
      } catch (error) {
        console.error('Error uploading file:', error);
        alert((t('errorUploadingFile') || 'Chyba při nahrávání souboru') + `: ${file.name}`);
      }
    }
    
    await loadFiles();
    setLoading(false);
    alert(t('filesUploaded') || `Nahráno ${files.length} soubor(ů)`);
  }, [loadFiles, t]);

  const handleDragOver = useCallback((e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(folder);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);
  }, []);

  // Format modification date
  const formatModifiedDate = useCallback((dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('cs-CZ', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }, []);

  // Determine language for Monaco Editor based on file extension
  const editorLanguage = useMemo(() => {
    return getLanguageFromFilename(selectedFile);
  }, [selectedFile]);

  // Monaco Editor settings
  const editorOptions = useMemo(() => ({
    minimap: { enabled: true },
    fontSize: 13,
    fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on',
    tabSize: 2,
    insertSpaces: true,
    folding: true,
    bracketPairColorization: { enabled: true },
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    formatOnPaste: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    readOnly: !isEditing,
  }), [isEditing]);

  // Group files by folders
  const groupedFiles = files.reduce((acc, file) => {
    const parts = file.path.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(file);
    return acc;
  }, {});

  return (
    <div style={{ height: 'calc(100% - 20px)' , display: 'flex', gap: 12 }}>
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
            className="btn btn-add"
            onClick={() => document.getElementById('file-upload-input')?.click()}
            disabled={loading}
            style={{ fontSize: 12, padding: '4px 10px' }}
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
          <div 
            key={folder} 
            style={{ marginBottom: 16 }}
            onDrop={(e) => handleDrop(e, folder)}
            onDragOver={(e) => handleDragOver(e, folder)}
            onDragLeave={handleDragLeave}
          >
            <div style={{ 
              fontSize: 12, 
              fontWeight: 600, 
              color: '#374151', 
              marginBottom: 4,
              padding: '4px 8px',
              borderBottom: '1px solid #e5e7eb',
              background: dragOverFolder === folder ? '#dbeafe' : 'transparent',
              borderRadius: dragOverFolder === folder ? 6 : 0,
              transition: 'background 0.15s, border-radius 0.15s'
            }}>
              📁 {folder}
              {dragOverFolder === folder && (
                <span style={{ marginLeft: 8, color: '#3b82f6', fontSize: 11 }}>
                  ⬆ {t('dropToUpload') || 'Přetáhněte sem pro nahrání'}
                </span>
              )}
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
                <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.isText ? '📄' : '📦'} {file.name}
                  </div>
                  {file.modified && (
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                      🕒 {formatModifiedDate(file.modified)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="btn btn-edit"
                    onClick={(e) => { e.stopPropagation(); downloadFile(file.path); }}
                    style={{ padding: '2px 6px', fontSize: 11 }}
                    title={t('download') || 'Stáhnout'}
                  >
                    ⬇
                  </button>
                  <button
                    className="btn btn-delete"
                    onClick={(e) => { e.stopPropagation(); deleteFile(file.path); }}
                    style={{ padding: '2px 6px', fontSize: 11 }}
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
                      className="btn btn-add"
                      onClick={saveFileContent}
                      disabled={loading}
                    >
                      {t('save') || 'Uložit'}
                    </button>
                    <button
                      className="btn btn-cancel"
                      onClick={() => { setIsEditing(false); loadFileContent(selectedFileInfo); }}
                      disabled={loading}
                    >
                      {t('cancel') || 'Zrušit'}
                    </button>
                  </>
                ) : selectedFileInfo.isText ? (
                  <button
                    className="btn btn-edit"
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                  >
                    {t('edit') || 'Upravit'}
                  </button>
                ) : null}
              </div>
            </div>

            {selectedFileInfo.isText ? (
              <div style={{ 
                flex: 1, 
                border: '1px solid #e5e7eb', 
                borderRadius: 6, 
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Editor toolbar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: editorTheme === 'vs' ? '#f5f5f5' : '#1e1e1e',
                  borderBottom: `1px solid ${editorTheme === 'vs' ? '#e5e7eb' : '#333'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Indikátor jazyka */}
                    <span style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: editorTheme === 'vs' ? '#1d4ed8' : '#60a5fa',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500,
                      textTransform: 'uppercase'
                    }}>
                      {editorLanguage}
                    </span>
                    
                    {/* Theme selector */}
                    <select
                      value={editorTheme}
                      onChange={(e) => handleThemeChange(e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: `1px solid ${editorTheme === 'vs' ? '#d1d5db' : '#555'}`,
                        background: editorTheme === 'vs' ? '#fff' : '#333',
                        color: editorTheme === 'vs' ? '#374151' : '#e5e7eb',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      {availableThemes.map(theme => (
                        <option key={theme.value} value={theme.value}>
                          🎨 {theme.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Open in new window button */}
                  <button
                    onClick={openInNewWindow}
                    style={{
                      padding: '4px 10px',
                      background: 'transparent',
                      color: editorTheme === 'vs' ? '#374151' : '#e5e7eb',
                      border: `1px solid ${editorTheme === 'vs' ? '#d1d5db' : '#555'}`,
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    title={t('openInNewWindow') || 'Otevřít v novém okně'}
                  >
                    ↗ {t('newWindow') || 'Nové okno'}
                  </button>
                </div>
                
                {/* Monaco Editor */}
                <div style={{ flex: 1 }}>
                  <Editor
                    height="100%"
                    language={editorLanguage}
                    value={fileContent}
                    onChange={(value) => setFileContent(value || '')}
                    options={editorOptions}
                    theme={editorTheme}
                    loading={
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        color: '#6b7280'
                      }}>
                        {t('loading') || 'Načítání editoru...'}
                      </div>
                    }
                  />
                </div>
              </div>
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
