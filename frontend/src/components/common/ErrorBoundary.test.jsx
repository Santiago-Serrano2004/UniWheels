import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const Bomb = () => {
  throw new Error('boom');
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy;

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });

  it('renderiza a los hijos con normalidad cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <p>Contenido normal</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('Contenido normal')).toBeInTheDocument();
  });

  it('variante "contained": muestra el fallback y no la app completa cuando un hijo revienta', () => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary variant="contained">
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getByText('Algo salió mal en esta sección')).toBeInTheDocument();
    expect(screen.getByText('Intentar de nuevo')).toBeInTheDocument();
  });

  it('variante "silent": no renderiza ningún fallback visible ante un error', () => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <ErrorBoundary variant="silent">
        <Bomb />
      </ErrorBoundary>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('variante por defecto (fatal): muestra el botón de recargar aplicación', () => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getByText('UniWheels tuvo un problema inesperado')).toBeInTheDocument();
    expect(screen.getByText('Recargar Aplicación')).toBeInTheDocument();
  });

  it('el botón "Intentar de nuevo" llama a onReset', () => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onReset = vi.fn();

    render(
      <ErrorBoundary variant="contained" onReset={onReset}>
        <Bomb />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Intentar de nuevo'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
