#!/usr/bin/env node

/**
 * MCP Server Test Script
 * Tests the HarmonyOS MCP server tools
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, '../build/server.js');

async function callTool(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [serverPath]);
    
    let stdout = '';
    let stderr = '';
    
    server.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    server.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    server.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Server exited with code ${code}\n${stderr}`));
      } else {
        try {
          // Parse the last JSON line from stdout
          const lines = stdout.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const result = JSON.parse(lastLine);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}\n${stdout}`));
        }
      }
    });
    
    // Send tool call request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };
    
    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
  });
}

async function runTests() {
  console.log('🧪 Testing HarmonyOS MCP Server\n');
  
  // Test 1: Get project info
  console.log('📋 Test 1: Get Project Info');
  try {
    const result = await callTool('harmonyos_get_project_info', {
      projectPath: '/Users/clz/projects/HarmonyOS-APM'
    });
    console.log('✅ Success!');
    console.log(JSON.stringify(result.result.content[0].text, null, 2));
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
  console.log();
  
  // Test 2: List modules
  console.log('📦 Test 2: List Modules');
  try {
    const result = await callTool('harmonyos_list_modules', {
      projectPath: '/Users/clz/projects/HarmonyOS-APM'
    });
    console.log('✅ Success!');
    console.log(JSON.stringify(result.result.content[0].text, null, 2));
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
  console.log();
  
  // Test 3: Check build outputs
  console.log('🔨 Test 3: Check Build Outputs');
  try {
    const result = await callTool('harmonyos_check_build_outputs', {
      projectPath: '/Users/clz/projects/HarmonyOS-APM'
    });
    console.log('✅ Success!');
    console.log(JSON.stringify(result.result.content[0].text, null, 2));
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
  console.log();
  
  // Test 4: List devices
  console.log('📱 Test 4: List Devices');
  try {
    const result = await callTool('harmonyos_list_devices');
    console.log('✅ Success!');
    console.log(JSON.stringify(result.result.content[0].text, null, 2));
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
  console.log();
  
  console.log('🎉 All tests completed!');
}

runTests().catch(console.error);
