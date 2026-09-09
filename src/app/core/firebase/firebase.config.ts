import { FirebaseOptions } from 'firebase/app';

/**
 * Configuração do projeto Firebase (Hosting + Analytics).
 * Estas chaves são públicas por natureza no SDK web do Firebase — a
 * segurança do projeto é garantida pelas regras do Firebase, não pelo
 * sigilo destes valores.
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyACFlh6u6XNFNUc6b306gZNwmeR7KmH96A',
  authDomain: 'calculadora-aeca3.firebaseapp.com',
  projectId: 'calculadora-aeca3',
  storageBucket: 'calculadora-aeca3.firebasestorage.app',
  messagingSenderId: '533382816552',
  appId: '1:533382816552:web:9ad97a57ebb285f6b7661d',
  measurementId: 'G-RCFPCJV4K6',
};
