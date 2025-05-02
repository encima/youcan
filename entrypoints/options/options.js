import { storage } from '@wxt-dev/storage';

// Default values
const DEFAULT_LANGUAGE = 'FI';
const DEFAULT_KEY = ''; // Default key, should be replaced by user
const DEFAULT_WORD_COUNT = 100;

// Save options to storage
const saveOptions = async () => {
    const language = document.getElementById('language').value;
    const apiKey = document.getElementById('deepl-key').value;
    const wordCount = document.getElementById('word-count').value;
    
    try {
        // Save all settings
        await storage.setItem('local:targetLang', language);
        await storage.setItem('local:deeplKey', apiKey);
        await storage.setItem('local:wordCount', wordCount);
        
        // Show success message
        const status = document.getElementById('status');
        status.textContent = 'Options saved successfully!';
        status.style.display = 'block';
        status.style.backgroundColor = '#d4edda';
        status.style.color = '#155724';
        
        // Hide message after a delay
        setTimeout(() => {
            status.style.display = 'none';
        }, 2000);
    } catch (error) {
        // Show error message
        const status = document.getElementById('status');
        status.textContent = 'Error saving options: ' + error.message;
        status.style.display = 'block';
        status.style.backgroundColor = '#f8d7da';
        status.style.color = '#721c24';
    }
};

// Restore options from storage
const restoreOptions = async () => {
    try {
        // Get saved values or use defaults
        const language = await storage.getItem('local:targetLang') || DEFAULT_LANGUAGE;
        const apiKey = await storage.getItem('local:deeplKey') || DEFAULT_KEY;
        const wordCount = await storage.getItem('local:wordCount') || DEFAULT_WORD_COUNT;
        
        // Set form values
        document.getElementById('language').value = language;
        document.getElementById('deepl-key').value = apiKey;
        document.getElementById('word-count').value = wordCount;
    } catch (error) {
        console.error('Error loading options:', error);
    }
};

// Reset options to defaults
const resetOptions = async () => {
    try {
        // Reset to defaults
        await storage.setItem('local:targetLang', DEFAULT_LANGUAGE);
        await storage.setItem('local:deeplKey', DEFAULT_KEY);
        await storage.setItem('local:wordCount', DEFAULT_WORD_COUNT);
        
        // Update form values
        document.getElementById('language').value = DEFAULT_LANGUAGE;
        document.getElementById('deepl-key').value = DEFAULT_KEY;
        document.getElementById('word-count').value = DEFAULT_WORD_COUNT;
        
        // Show success message
        const status = document.getElementById('status');
        status.textContent = 'Options reset to defaults.';
        status.style.display = 'block';
        status.style.backgroundColor = '#d4edda';
        status.style.color = '#155724';
        
        // Hide message after a delay
        setTimeout(() => {
            status.style.display = 'none';
        }, 2000);
    } catch (error) {
        // Show error message
        const status = document.getElementById('status');
        status.textContent = 'Error resetting options: ' + error.message;
        status.style.display = 'block';
        status.style.backgroundColor = '#f8d7da';
        status.style.color = '#721c24';
    }
};

// Set up event listeners
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('reset').addEventListener('click', resetOptions);