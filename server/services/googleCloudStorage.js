const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

/**
 * Google Cloud Storage Service
 * Handles all interactions with Google Cloud Storage for movie hosting
 */
class GoogleCloudStorageService {
    constructor() {
        // Initialize GCS client
        this.storage = new Storage({
            projectId: process.env.GCS_PROJECT_ID,
            keyFilename: process.env.GCS_KEY_FILE || path.join(__dirname, '../config/gcp-service-key.json')
        });

        this.bucketName = process.env.GCS_BUCKET_NAME || 'unruly-movies-free';
        this.bucket = this.storage.bucket(this.bucketName);
        this.publicUrl = process.env.GCS_PUBLIC_URL || `https://storage.googleapis.com/${this.bucketName}`;
    }

    /**
     * Upload a movie file to Google Cloud Storage
     * @param {string} filePath - Local path to the file
     * @param {string} destination - Destination path in GCS (e.g., 'movies/movie-id/video.mp4')
     * @param {object} metadata - Optional metadata for the file
     * @returns {Promise<object>} Upload result with public URL
     */
    async uploadMovie(filePath, destination, metadata = {}) {
        try {
            console.log(`Uploading ${filePath} to gs://${this.bucketName}/${destination}`);

            const options = {
                destination: destination,
                metadata: {
                    contentType: metadata.contentType || 'video/mp4',
                    metadata: {
                        originalName: metadata.originalName || path.basename(filePath),
                        uploadedAt: new Date().toISOString(),
                        ...metadata.custom
                    }
                },
                resumable: true, // Enable resumable uploads for large files
                validation: 'crc32c' // Verify upload integrity
            };

            // Upload the file
            const [file] = await this.bucket.upload(filePath, options);

            console.log(`✓ File uploaded successfully: ${file.name}`);

            return {
                success: true,
                fileName: file.name,
                bucketName: this.bucketName,
                publicUrl: `${this.publicUrl}/${destination}`,
                size: file.metadata.size,
                contentType: file.metadata.contentType,
                created: file.metadata.timeCreated
            };
        } catch (error) {
            console.error('Error uploading file to GCS:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    /**
     * Upload from buffer (useful for direct uploads from frontend)
     * @param {Buffer} buffer - File buffer
     * @param {string} destination - Destination path in GCS
     * @param {object} metadata - File metadata
     * @returns {Promise<object>} Upload result
     */
    async uploadFromBuffer(buffer, destination, metadata = {}) {
        try {
            const file = this.bucket.file(destination);

            await file.save(buffer, {
                contentType: metadata.contentType || 'video/mp4',
                metadata: {
                    metadata: {
                        uploadedAt: new Date().toISOString(),
                        ...metadata.custom
                    }
                },
                resumable: false
            });

            console.log(`✓ Buffer uploaded successfully: ${destination}`);

            return {
                success: true,
                fileName: destination,
                bucketName: this.bucketName,
                publicUrl: `${this.publicUrl}/${destination}`,
                contentType: metadata.contentType
            };
        } catch (error) {
            console.error('Error uploading buffer to GCS:', error);
            throw new Error(`Failed to upload buffer: ${error.message}`);
        }
    }

    /**
     * Generate a signed URL for secure, time-limited access to a file
     * @param {string} fileName - File path in GCS
     * @param {number} expiresIn - Expiration time in seconds (default: 4 hours)
     * @returns {Promise<string>} Signed URL
     */
    async generateSignedUrl(fileName, expiresIn = 14400) {
        try {
            const file = this.bucket.file(fileName);

            const [url] = await file.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + (expiresIn * 1000)
            });

            console.log(`✓ Generated signed URL for: ${fileName}`);
            return url;
        } catch (error) {
            console.error('Error generating signed URL:', error);
            throw new Error(`Failed to generate signed URL: ${error.message}`);
        }
    }

    /**
     * Generate signed URLs for multiple files (e.g., video + subtitles)
     * @param {Array<string>} fileNames - Array of file paths
     * @param {number} expiresIn - Expiration time in seconds
     * @returns {Promise<object>} Object with fileName: signedUrl pairs
     */
    async generateMultipleSignedUrls(fileNames, expiresIn = 14400) {
        try {
            const urls = {};
            
            for (const fileName of fileNames) {
                urls[fileName] = await this.generateSignedUrl(fileName, expiresIn);
            }

            return urls;
        } catch (error) {
            console.error('Error generating multiple signed URLs:', error);
            throw new Error(`Failed to generate signed URLs: ${error.message}`);
        }
    }

    /**
     * Delete a file from Google Cloud Storage
     * @param {string} fileName - File path in GCS
     * @returns {Promise<boolean>} Success status
     */
    async deleteFile(fileName) {
        try {
            await this.bucket.file(fileName).delete();
            console.log(`✓ File deleted: ${fileName}`);
            return true;
        } catch (error) {
            console.error('Error deleting file from GCS:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    /**
     * Delete multiple files
     * @param {Array<string>} fileNames - Array of file paths to delete
     * @returns {Promise<object>} Results with success/failure for each file
     */
    async deleteMultipleFiles(fileNames) {
        const results = {
            success: [],
            failed: []
        };

        for (const fileName of fileNames) {
            try {
                await this.deleteFile(fileName);
                results.success.push(fileName);
            } catch (error) {
                results.failed.push({ fileName, error: error.message });
            }
        }

        return results;
    }

    /**
     * Check if a file exists in GCS
     * @param {string} fileName - File path in GCS
     * @returns {Promise<boolean>} True if file exists
     */
    async fileExists(fileName) {
        try {
            const [exists] = await this.bucket.file(fileName).exists();
            return exists;
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    /**
     * Get file metadata
     * @param {string} fileName - File path in GCS
     * @returns {Promise<object>} File metadata
     */
    async getFileMetadata(fileName) {
        try {
            const file = this.bucket.file(fileName);
            const [metadata] = await file.getMetadata();

            return {
                name: metadata.name,
                size: metadata.size,
                contentType: metadata.contentType,
                created: metadata.timeCreated,
                updated: metadata.updated,
                md5Hash: metadata.md5Hash,
                crc32c: metadata.crc32c
            };
        } catch (error) {
            console.error('Error getting file metadata:', error);
            throw new Error(`Failed to get file metadata: ${error.message}`);
        }
    }

    /**
     * List files in a directory
     * @param {string} prefix - Directory prefix (e.g., 'movies/')
     * @param {number} maxResults - Maximum number of results
     * @returns {Promise<Array>} Array of file objects
     */
    async listFiles(prefix = '', maxResults = 1000) {
        try {
            const [files] = await this.bucket.getFiles({
                prefix: prefix,
                maxResults: maxResults
            });

            return files.map(file => ({
                name: file.name,
                size: file.metadata.size,
                contentType: file.metadata.contentType,
                created: file.metadata.timeCreated,
                publicUrl: `${this.publicUrl}/${file.name}`
            }));
        } catch (error) {
            console.error('Error listing files:', error);
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    /**
     * Copy a file within GCS
     * @param {string} sourceFileName - Source file path
     * @param {string} destinationFileName - Destination file path
     * @returns {Promise<object>} Copy result
     */
    async copyFile(sourceFileName, destinationFileName) {
        try {
            const sourceFile = this.bucket.file(sourceFileName);
            const [destinationFile] = await sourceFile.copy(destinationFileName);

            console.log(`✓ File copied: ${sourceFileName} → ${destinationFileName}`);

            return {
                success: true,
                source: sourceFileName,
                destination: destinationFileName,
                publicUrl: `${this.publicUrl}/${destinationFileName}`
            };
        } catch (error) {
            console.error('Error copying file:', error);
            throw new Error(`Failed to copy file: ${error.message}`);
        }
    }

    /**
     * Move a file (copy then delete original)
     * @param {string} sourceFileName - Source file path
     * @param {string} destinationFileName - Destination file path
     * @returns {Promise<object>} Move result
     */
    async moveFile(sourceFileName, destinationFileName) {
        try {
            await this.copyFile(sourceFileName, destinationFileName);
            await this.deleteFile(sourceFileName);

            console.log(`✓ File moved: ${sourceFileName} → ${destinationFileName}`);

            return {
                success: true,
                source: sourceFileName,
                destination: destinationFileName,
                publicUrl: `${this.publicUrl}/${destinationFileName}`
            };
        } catch (error) {
            console.error('Error moving file:', error);
            throw new Error(`Failed to move file: ${error.message}`);
        }
    }

    /**
     * Make a file publicly accessible (use with caution!)
     * @param {string} fileName - File path in GCS
     * @returns {Promise<string>} Public URL
     */
    async makePublic(fileName) {
        try {
            await this.bucket.file(fileName).makePublic();
            const publicUrl = `${this.publicUrl}/${fileName}`;
            
            console.log(`✓ File made public: ${publicUrl}`);
            return publicUrl;
        } catch (error) {
            console.error('Error making file public:', error);
            throw new Error(`Failed to make file public: ${error.message}`);
        }
    }

    /**
     * Get storage usage statistics
     * @returns {Promise<object>} Storage statistics
     */
    async getStorageStats() {
        try {
            const [files] = await this.bucket.getFiles();
            
            let totalSize = 0;
            let fileCount = 0;
            const fileTypes = {};

            files.forEach(file => {
                totalSize += parseInt(file.metadata.size || 0);
                fileCount++;
                
                const contentType = file.metadata.contentType || 'unknown';
                fileTypes[contentType] = (fileTypes[contentType] || 0) + 1;
            });

            return {
                totalFiles: fileCount,
                totalSizeBytes: totalSize,
                totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
                fileTypes: fileTypes,
                bucketName: this.bucketName
            };
        } catch (error) {
            console.error('Error getting storage stats:', error);
            throw new Error(`Failed to get storage stats: ${error.message}`);
        }
    }

    /**
     * Generate a resumable upload URL for large files
     * @param {string} destination - Destination path in GCS
     * @param {object} metadata - File metadata
     * @returns {Promise<string>} Resumable upload URL
     */
    async generateResumableUploadUrl(destination, metadata = {}) {
        try {
            const file = this.bucket.file(destination);
            
            const [url] = await file.createResumableUpload({
                metadata: {
                    contentType: metadata.contentType || 'video/mp4',
                    metadata: metadata.custom || {}
                }
            });

            console.log(`✓ Generated resumable upload URL for: ${destination}`);
            return url;
        } catch (error) {
            console.error('Error generating resumable upload URL:', error);
            throw new Error(`Failed to generate resumable upload URL: ${error.message}`);
        }
    }
}

// Export singleton instance
module.exports = new GoogleCloudStorageService();
