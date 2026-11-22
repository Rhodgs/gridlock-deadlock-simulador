import { nenhuma } from './nenhuma.js';

// Deixa o deadlock acontecer, detecta e recupera sozinha no passo seguinte.
export const recuperacao = { ...nenhuma, nome: 'recuperacao', autoRecuperar: true };
