/**
 * Test script for Google Cloud Storage integration
 * Run this to verify your GCS setup is working correctly
 */

const gcsService = require('../services/googleCloudStorage');
const fs = require('fs').promises;
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠ ${message}`, 'yellow');
}

async function createTestFile() {
    const testContent = 'This is a test file for Google Cloud Storage integration.';
    const testFilePath = path.join(__dirname, 'test-upload.txt');
    
    await fs.writeFile(testFilePath, testContent);
    return testFilePath;
}

async function runTests() {
    log('\n' + '='.repeat(60), 'bold');
    log('Google Cloud Storage Integration Test', 'bold');
    log('='.repeat(60) + '\n', 'bold');

    let testFilePath;
    let uploadedFileName;

    try {
        // Test 1: Check environment variables
        log('\n[Test 1] Checking environment variables...', 'yellow');
        
        const requiredEnvVars = ['GCS_PROJECT_ID', 'GCS_BUCKET_NAME'];
        let envVarsOk = true;

        for (const envVar of requiredEnvVars) {
            if (process.env[envVar]) {
                logSuccess(`${envVar} is set: ${process.env[envVar]}`);
            } else {
                logError(`${envVar} is not set`);
                envVarsOk = false;
            }
        }

        if (!envVarsOk) {
            logError('Please set all required environment variables in .env file');
            process.exit(1);
        }

        // Test 2: Create test file
        log('\n[Test 2] Creating test file...', 'yellow');
        testFilePath = await createTestFile();
        logSuccess(`Test file created: ${testFilePath}`);

        // Test 3: Upload file to GCS
        log('\n[Test 3] Uploading file to Google Cloud Storage...', 'yellow');
        uploadedFileName = `test-uploads/test-${Date.now()}.txt`;
        
        const uploadResult = await gcsService.uploadMovie(
            testFilePath,
            uploadedFileName,
            {
                contentType: 'text/plain',
                originalName: 'test-upload.txt',
                custom: {
                    testRun: true,
                    timestamp: new Date().toISOString()
                }
            }
        );

        logSuccess('File uploaded successfully!');
        logInfo(`  Bucket: ${uploadResult.bucketName}`);
        logInfo(`  File: ${uploadResult.fileName}`);
        logInfo(`  Size: ${uploadResult.size} bytes`);
        logInfo(`  Public URL: ${uploadResult.publicUrl}`);

        // Test 4: Check if file exists
        log('\n[Test 4] Checking if file exists in GCS...', 'yellow');
        const exists = await gcsService.fileExists(uploadedFileName);
        
        if (exists) {
            logSuccess('File exists in GCS');
        } else {
            logError('File does not exist in GCS');
        }

        // Test 5: Get file metadata
        log('\n[Test 5] Getting file metadata...', 'yellow');
        const metadata = await gcsService.getFileMetadata(uploadedFileName);
        
        logSuccess('Metadata retrieved successfully!');
        logInfo(`  Name: ${metadata.name}`);
        logInfo(`  Size: ${metadata.size} bytes`);
        logInfo(`  Content Type: ${metadata.contentType}`);
        logInfo(`  Created: ${metadata.created}`);
        logInfo(`  MD5 Hash: ${metadata.md5Hash}`);

        // Test 6: Generate signed URL
        log('\n[Test 6] Generating signed URL...', 'yellow');
        const signedUrl = await gcsService.generateSignedUrl(uploadedFileName, 3600);
        
        logSuccess('Signed URL generated successfully!');
        logInfo(`  URL: ${signedUrl.substring(0, 100)}...`);
        logInfo(`  Expires in: 1 hour`);

        // Test 7: List files
        log('\n[Test 7] Listing files in bucket...', 'yellow');
        const files = await gcsService.listFiles('test-uploads/', 10);
        
        logSuccess(`Found ${files.length} file(s) in test-uploads/`);
        files.forEach((file, index) => {
            logInfo(`  ${index + 1}. ${file.name} (${file.size} bytes)`);
        });

        // Test 8: Get storage statistics
        log('\n[Test 8] Getting storage statistics...', 'yellow');
        const stats = await gcsService.getStorageStats();
        
        logSuccess('Storage statistics retrieved!');
        logInfo(`  Total Files: ${stats.totalFiles}`);
        logInfo(`  Total Size: ${stats.totalSizeGB} GB`);
        logInfo(`  Bucket: ${stats.bucketName}`);

        // Test 9: Copy file
        log('\n[Test 9] Testing file copy...', 'yellow');
        const copyDestination = `test-uploads/test-copy-${Date.now()}.txt`;
        const copyResult = await gcsService.copyFile(uploadedFileName, copyDestination);
        
        logSuccess('File copied successfully!');
        logInfo(`  From: ${copyResult.source}`);
        logInfo(`  To: ${copyResult.destination}`);

        // Test 10: Delete files
        log('\n[Test 10] Cleaning up test files...', 'yellow');
        const filesToDelete = [uploadedFileName, copyDestination];
        const deleteResults = await gcsService.deleteMultipleFiles(filesToDelete);
        
        logSuccess(`Deleted ${deleteResults.success.length} file(s)`);
        deleteResults.success.forEach(file => {
            logInfo(`  ✓ ${file}`);
        });

        if (deleteResults.failed.length > 0) {
            logWarning(`Failed to delete ${deleteResults.failed.length} file(s)`);
            deleteResults.failed.forEach(failure => {
                logError(`  ✗ ${failure.fileName}: ${failure.error}`);
            });
        }

        // Clean up local test file
        await fs.unlink(testFilePath);
        logSuccess('Local test file deleted');

        // Final summary
        log('\n' + '='.repeat(60), 'bold');
        log('All tests completed successfully! ✓', 'green');
        log('='.repeat(60) + '\n', 'bold');

        logInfo('Your Google Cloud Storage integration is working correctly!');
        logInfo('You can now:');
        logInfo('  1. Upload movies using the /api/upload/movie endpoint');
        logInfo('  2. Generate streaming URLs using /api/upload/stream/:movieId');
        logInfo('  3. Upload posters and subtitles');
        logInfo('  4. Monitor storage usage');

    } catch (error) {
        logError('\n✗ Test failed!');
        logError(`Error: ${error.message}`);
        
        if (error.code === 'ENOENT') {
            logError('\nService account key file not found!');
            logInfo('Please ensure:');
            logInfo('  1. You have created a service account in Google Cloud Console');
            logInfo('  2. Downloaded the JSON key file');
            logInfo('  3. Saved it as server/config/gcp-service-key.json');
            logInfo('  4. Or set GCS_KEY_FILE environment variable to the correct path');
        } else if (error.code === 403) {
            logError('\nPermission denied!');
            logInfo('Please ensure:');
            logInfo('  1. Your service account has Storage Admin role');
            logInfo('  2. The bucket exists and is accessible');
            logInfo('  3. Billing is enabled on your Google Cloud project');
        } else if (error.code === 404) {
            logError('\nBucket not found!');
            logInfo('Please ensure:');
            logInfo('  1. The bucket name in .env is correct');
            logInfo('  2. The bucket exists in your Google Cloud project');
            logInfo('  3. Run: gsutil mb gs://your-bucket-name');
        }

        console.error('\nFull error details:', error);

        // Clean up on error
        if (testFilePath) {
            try {
                await fs.unlink(testFilePath);
            } catch (e) {
                // Ignore cleanup errors
            }
        }

        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    // Load environment variables
    require('dotenv').config({ path: path.join(__dirname, '../.env') });

    runTests().catch(error => {
        logError('Unexpected error:');
        console.error(error);
        process.exit(1);
    });
}

module.exports = { runTests };
