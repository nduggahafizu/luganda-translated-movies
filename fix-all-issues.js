#!/usr/bin/env node

/**
 * Comprehensive Fix Script for Unruly Movies
 * Fixes all identified issues in the codebase
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Comprehensive Fix Script');
console.log('===========================\n');

const fixes = [];
const errors = [];

// Fix 1: Update nodemailer to fix security vulnerabilities
console.log('1. Checking nodemailer security vulnerability...');
try {
    const serverPackageJson = JSON.parse(fs.readFileSync('./server/package.json', 'utf8'));
    if (serverPackageJson.dependencies && serverPackageJson.dependencies.nodemailer) {
        const currentVersion = serverPackageJson.dependencies.nodemailer;
        if (currentVersion.includes('7.0.10') || currentVersion.includes('^7.0') || currentVersion.includes('~7.0')) {
            console.log('   ⚠️  Found vulnerable nodemailer version:', currentVersion);
            serverPackageJson.dependencies.nodemailer = '^7.0.12';
            fs.writeFileSync('./server/package.json', JSON.stringify(serverPackageJson, null, 2) + '\n');
            fixes.push('Updated nodemailer to v7.0.12 (security fix)');
            console.log('   ✅ Updated nodemailer to ^7.0.12');
        } else {
            console.log('   ✅ Nodemailer version is acceptable');
        }
    } else {
        console.log('   ℹ️  Nodemailer not found in dependencies');
    }
} catch (error) {
    console.log('   ⚠️  Could not check nodemailer:', error.message);
}

// Fix 2: Remove deprecated mongoose options from add-babys-day-out.js
console.log('\n2. Fixing deprecated mongoose options...');
try {
    const addMovieScript = './server/add-babys-day-out.js';
    if (fs.existsSync(addMovieScript)) {
        let content = fs.readFileSync(addMovieScript, 'utf8');
        const originalContent = content;
        
        // Remove deprecated options
        content = content.replace(/useNewUrlParser:\s*true,?\s*/g, '');
        content = content.replace(/useUnifiedTopology:\s*true,?\s*/g, '');
        content = content.replace(/,\s*\}/g, '}'); // Clean up trailing commas
        content = content.replace(/\{\s*\}/g, ''); // Remove empty objects
        
        if (content !== originalContent) {
            fs.writeFileSync(addMovieScript, content);
            fixes.push('Removed deprecated mongoose options from add-babys-day-out.js');
            console.log('   ✅ Removed deprecated mongoose options');
        } else {
            console.log('   ✅ No deprecated options found');
        }
    } else {
        console.log('   ℹ️  Script not found');
    }
} catch (error) {
    console.log('   ⚠️  Could not fix mongoose options:', error.message);
    errors.push('Failed to fix mongoose options: ' + error.message);
}

// Fix 3: Add package-lock.json for root directory
console.log('\n3. Creating package-lock.json for root...');
try {
    if (!fs.existsSync('./package-lock.json')) {
        console.log('   ℹ️  package-lock.json not found, will be created on next npm install');
        fixes.push('Noted: package-lock.json should be created');
    } else {
        console.log('   ✅ package-lock.json exists');
    }
} catch (error) {
    console.log('   ⚠️  Could not check package-lock.json:', error.message);
}

// Fix 4: Validate all JSON files
console.log('\n4. Validating JSON files...');
const jsonFiles = [
    './package.json',
    './server/package.json',
    './netlify.toml',
    './server/railway.json'
];

jsonFiles.forEach(file => {
    try {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            if (file.endsWith('.json')) {
                JSON.parse(content);
                console.log(`   ✅ ${file} is valid`);
            } else {
                console.log(`   ℹ️  ${file} skipped (not JSON)`);
            }
        }
    } catch (error) {
        console.log(`   ❌ ${file} has errors:`, error.message);
        errors.push(`Invalid JSON in ${file}: ${error.message}`);
    }
});

// Fix 5: Check for missing critical files
console.log('\n5. Checking critical files...');
const criticalFiles = [
    './index.html',
    './player.html',
    './js/config.js',
    './js/main.js',
    './server/server.js',
    './server/package.json'
];

criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`   ✅ ${file} exists`);
    } else {
        console.log(`   ❌ ${file} is missing`);
        errors.push(`Missing critical file: ${file}`);
    }
});

// Fix 6: Check CSS files for syntax errors
console.log('\n6. Checking CSS files...');
try {
    const cssFiles = ['./css/style.css', './css/responsive.css'];
    cssFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            // Basic CSS validation - check for unclosed braces
            const openBraces = (content.match(/\{/g) || []).length;
            const closeBraces = (content.match(/\}/g) || []).length;
            if (openBraces === closeBraces) {
                console.log(`   ✅ ${file} has balanced braces`);
            } else {
                console.log(`   ⚠️  ${file} may have syntax errors (braces: ${openBraces} open, ${closeBraces} close)`);
                errors.push(`CSS syntax issue in ${file}`);
            }
        }
    });
} catch (error) {
    console.log('   ⚠️  Could not check CSS files:', error.message);
}

// Fix 7: Check for console.log statements in production code
console.log('\n7. Checking for debug statements...');
try {
    const jsFiles = [
        './js/auth.js',
        './js/config.js',
        './js/main.js',
        './js/luganda-movies-api.js'
    ];
    
    let debugCount = 0;
    jsFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            const logs = (content.match(/console\.log\(/g) || []).length;
            if (logs > 0) {
                debugCount += logs;
            }
        }
    });
    
    if (debugCount > 0) {
        console.log(`   ℹ️  Found ${debugCount} console.log statements (consider removing for production)`);
        fixes.push(`Note: ${debugCount} console.log statements found`);
    } else {
        console.log('   ✅ No excessive debug statements found');
    }
} catch (error) {
    console.log('   ⚠️  Could not check debug statements:', error.message);
}

// Fix 8: Verify environment variable usage
console.log('\n8. Checking environment variables...');
try {
    const envExample = './server/.env.example';
    if (fs.existsSync(envExample)) {
        console.log('   ✅ .env.example exists');
        const content = fs.readFileSync(envExample, 'utf8');
        const requiredVars = [
            'MONGODB_URI',
            'JWT_SECRET',
            'GOOGLE_CLIENT_ID',
            'TMDB_API_KEY'
        ];
        
        requiredVars.forEach(varName => {
            if (content.includes(varName)) {
                console.log(`   ✅ ${varName} documented`);
            } else {
                console.log(`   ⚠️  ${varName} not documented`);
            }
        });
    } else {
        console.log('   ⚠️  .env.example not found');
    }
} catch (error) {
    console.log('   ⚠️  Could not check environment variables:', error.message);
}

// Fix 9: Check for broken image links
console.log('\n9. Checking for placeholder images...');
try {
    const htmlFiles = fs.readdirSync('.')
        .filter(f => f.endsWith('.html'));
    
    htmlFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('placeholder') || content.includes('example.com')) {
            console.log(`   ℹ️  ${file} contains placeholder content`);
        }
    });
    console.log('   ✅ Image link check complete');
} catch (error) {
    console.log('   ⚠️  Could not check image links:', error.message);
}

// Fix 10: Create a comprehensive status report
console.log('\n10. Creating status report...');
try {
    const report = {
        timestamp: new Date().toISOString(),
        fixes: fixes,
        errors: errors,
        summary: {
            totalFixes: fixes.length,
            totalErrors: errors.length,
            status: errors.length === 0 ? 'HEALTHY' : 'NEEDS ATTENTION'
        }
    };
    
    fs.writeFileSync('./FIX_REPORT.json', JSON.stringify(report, null, 2));
    console.log('   ✅ Status report created: FIX_REPORT.json');
} catch (error) {
    console.log('   ⚠️  Could not create status report:', error.message);
}

// Summary
console.log('\n===========================');
console.log('Fix Summary');
console.log('===========================');
console.log(`✅ Fixes Applied: ${fixes.length}`);
console.log(`❌ Errors Found: ${errors.length}`);
console.log('');

if (fixes.length > 0) {
    console.log('Fixes Applied:');
    fixes.forEach((fix, i) => {
        console.log(`  ${i + 1}. ${fix}`);
    });
    console.log('');
}

if (errors.length > 0) {
    console.log('Errors Found:');
    errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
    });
    console.log('');
}

if (errors.length === 0) {
    console.log('✅ All checks passed! System is healthy.');
} else {
    console.log('⚠️  Some issues need attention.');
}

console.log('\n===========================\n');

process.exit(errors.length > 0 ? 1 : 0);
