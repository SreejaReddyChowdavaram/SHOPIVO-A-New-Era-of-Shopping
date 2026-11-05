/**
 * ProductImageSelector.jsx — Dual-Option Product Image Picker for Sellers
 * 
 * Supports:
 * 1. OPTION A: File Upload from Computer / Phone Gallery / Mobile Camera
 *    - Drag and drop on desktop
 *    - Native gallery and camera capture on mobile
 *    - Real-time client-side preview via URL.createObjectURL
 *    - File size and format validation (<= 5 MB; JPEG, PNG, WEBP)
 *    - Remove / Replace image actions
 * 2. OPTION B: External Image Web URL
 *    - Direct HTTPS image link with live preview
 * 
 * Rule: When both are provided, the selected upload file takes precedence.
 */

import { useState, useRef, useEffect } from 'react'
import {
  Upload,
  Camera,
  Link as LinkIcon,
  X,
  FileImage,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  RotateCw,
} from 'lucide-react'
import { resolveImageUrl, formatFileSize, validateImageFile } from '@/utils/imageUtils'

const ProductImageSelector = ({
  selectedFile,
  onFileSelect,
  onFileRemove,
  imageUrl,
  onUrlChange,
  existingImageUrl = null,
  uploadProgress = null,
}) => {
  const [activeTab, setActiveTab] = useState(selectedFile ? 'upload' : (imageUrl && !existingImageUrl ? 'url' : 'upload'))
  const [dragOver, setDragOver] = useState(false)
  const [localFileError, setLocalFileError] = useState(null)
  const [urlPreviewError, setUrlPreviewError] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  // Maintain preview URL for newly selected file
  useEffect(() => {
    if (selectedFile) {
      const objUrl = URL.createObjectURL(selectedFile)
      setPreviewUrl(objUrl)
      return () => {
        URL.revokeObjectURL(objUrl)
      }
    } else {
      setPreviewUrl(null)
    }
  }, [selectedFile])

  const handleFilePicked = (file) => {
    setLocalFileError(null)
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setLocalFileError(validation.error)
      return
    }

    onFileSelect(file)
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFilePicked(file)
    }
    // reset input so picking the same file again triggers change
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFilePicked(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const effectivePreviewSrc = selectedFile
    ? previewUrl
    : imageUrl?.trim()
    ? resolveImageUrl(imageUrl.trim())
    : existingImageUrl
    ? resolveImageUrl(existingImageUrl)
    : null

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* ── Section Title ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ImageIcon size={18} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
            Product Image
          </h2>
        </div>

        {/* Tab Toggle: Upload vs Web URL */}
        <div style={{ display: 'inline-flex', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', padding: '2px', backgroundColor: 'var(--color-bg-subtle)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '0.3rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'upload' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'upload' ? '#ffffff' : 'var(--color-text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={13} />
            <span>Upload Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            style={{
              padding: '0.3rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'url' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'url' ? '#ffffff' : 'var(--color-text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <LinkIcon size={13} />
            <span>Image Web URL</span>
          </button>
        </div>
      </div>

      {/* Notice regarding Precedence */}
      {selectedFile && imageUrl && (
        <div
          style={{
            fontSize: '0.75rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={15} />
          <span>Your uploaded file will take precedence over the external URL.</span>
        </div>
      )}

      {/* ── Main Two-Column Layout (Controls + Live Preview) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Chosen Option Controls */}
        <div>
          {activeTab === 'upload' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleInputChange}
                style={{ display: 'none' }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handleInputChange}
                style={{ display: 'none' }}
              />

              {!selectedFile ? (
                /* Drag & Drop Zone */
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1.75rem 1rem',
                    textAlign: 'center',
                    backgroundColor: dragOver ? 'var(--color-primary-subtle)' : 'var(--color-surface-raised)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.65rem',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Upload size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                      Click to choose photo
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
                      or drag and drop here from your computer
                    </span>
                  </div>

                  {/* Buttons for Mobile & Desktop */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '0.25rem',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      <FileImage size={13} style={{ marginRight: '4px' }} />
                      Browse Files
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => cameraInputRef.current?.click()}
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      title="Take a photo with your device camera"
                    >
                      <Camera size={13} style={{ marginRight: '4px' }} />
                      Take Photo
                    </button>
                  </div>

                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-disabled)' }}>
                    Supported: JPG, PNG, WEBP (Max 5 MB)
                  </span>
                </div>
              ) : (
                /* Selected File Card */
                <div
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem 1rem',
                    backgroundColor: 'var(--color-surface-raised)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileImage size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: '700',
                          color: 'var(--color-text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '220px',
                        }}
                        title={selectedFile.name}
                      >
                        {selectedFile.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                        {formatFileSize(selectedFile.size)} • Ready to upload
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      title="Replace with a different image"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={onFileRemove}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        padding: '0.35rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                      title="Remove selected image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Progress Bar */}
              {uploadProgress !== null && (
                <div style={{ marginTop: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <RotateCw size={12} className="spin" /> Uploading image to server...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '999px', backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${uploadProgress}%`,
                        height: '100%',
                        backgroundColor: 'var(--color-primary)',
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Validation error */}
              {localFileError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-danger)', fontSize: '0.75rem' }}>
                  <AlertCircle size={14} />
                  <span>{localFileError}</span>
                </div>
              )}
            </div>
          ) : (
            /* Option B: Web URL Input */
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                Image Web URL
              </label>
              <input
                type="url"
                name="imageUrl"
                placeholder="https://images.unsplash.com/... or https://example.com/item.jpg"
                value={imageUrl}
                onChange={(e) => {
                  setUrlPreviewError(false)
                  onUrlChange(e.target.value)
                }}
                className="form-input"
                style={{ width: '100%' }}
              />
              <p style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem', margin: 0 }}>
                Enter a direct image URL that can be displayed as an image, or upload the image from your device.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Live Thumbnail Preview */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
            Live Thumbnail Preview
          </label>
          <div
            style={{
              width: '150px',
              height: '150px',
              borderRadius: 'var(--radius-xs)',
              border: '1px dashed var(--color-border)',
              backgroundColor: 'var(--color-surface-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {effectivePreviewSrc && !urlPreviewError ? (
              <img
                src={effectivePreviewSrc}
                alt="Product preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={() => {
                  if (!selectedFile) setUrlPreviewError(true)
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--color-text-disabled)', padding: '0.5rem' }}>
                <ImageIcon size={28} style={{ margin: '0 auto 0.25rem' }} />
                <span style={{ fontSize: '0.7rem', display: 'block' }}>
                  {urlPreviewError ? 'Invalid URL' : 'No Image Selected'}
                </span>
              </div>
            )}

            {/* Badge showing origin */}
            {selectedFile && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  backgroundColor: 'rgba(37, 99, 235, 0.9)',
                  color: '#ffffff',
                  fontSize: '0.625rem',
                  fontWeight: '700',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >
                Local File
              </span>
            )}
            {!selectedFile && existingImageUrl && !imageUrl && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  backgroundColor: 'rgba(100, 116, 139, 0.85)',
                  color: '#ffffff',
                  fontSize: '0.625rem',
                  fontWeight: '600',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >
                Current
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default ProductImageSelector
