import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// jsdom doesn't provide these, React Router needs them
Object.assign(global, { TextEncoder, TextDecoder });
