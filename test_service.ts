
import { supabaseService } from './services/supabaseService';

console.log('Checking supabaseService...');
if (typeof supabaseService.getAllProfiles !== 'function') {
    console.error('ERROR: getAllProfiles is NOT a function');
    process.exit(1);
}
if (typeof supabaseService.getPosts !== 'function') {
    console.error('ERROR: getPosts is NOT a function');
    process.exit(1);
}
console.log('SUCCESS: supabaseService structure is valid');
