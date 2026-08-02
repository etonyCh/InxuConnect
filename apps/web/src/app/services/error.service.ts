import { Injectable, signal } from '@angular/core';

export interface AppError {
  id: string;
  type: 'validation' | 'auth' | 'network' | 'business' | 'server' | 'unknown';
  title: string;
  message: string;
  status?: number;
  field?: string;
  timestamp: number;
}

interface ValidationViolation {
  field: string;
  rejectedValue: string | null;
  message: string;
}

interface ProblemDetailShape {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  violations?: ValidationViolation[];
  error?: string;
  message?: string;
  errorCode?: string;
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private errorsSignal = signal<AppError[]>([]);
  public readonly errors = this.errorsSignal.asReadonly();

  pushFromApi(httpStatus: number, body: unknown): AppError[] {
    const parsed = this.parseProblem(body as ProblemDetailShape);
    const created: AppError[] = [];

    if (parsed.violations && parsed.violations.length > 0) {
      for (const v of parsed.violations) {
        created.push(this.makeError('validation', v.message, parsed.title ?? 'Validation échouée', httpStatus, v.field));
      }
    } else {
      const mappedType = this.mapErrorType(httpStatus, parsed.type ?? '');
      const msg = parsed.detail ?? parsed.message ?? parsed.error ?? 'Erreur inconnue';
      const title = parsed.title ?? this.fallbackTitle(httpStatus);
      created.push(this.makeError(mappedType, msg, title, httpStatus));
    }

    this.errorsSignal.update((prev) => [...created, ...prev].slice(0, 30));
    return created;
  }

  pushNetwork(message = 'Connexion impossible. Vérifiez votre réseau.'): AppError {
    const err = this.makeError('network', message, 'Connexion perdue');
    this.errorsSignal.update((prev) => [err, ...prev].slice(0, 30));
    return err;
  }

  pushGeneric(message: string, type: AppError['type'] = 'unknown', title = 'Erreur'): AppError {
    const err = this.makeError(type, message, title);
    this.errorsSignal.update((prev) => [err, ...prev].slice(0, 30));
    return err;
  }

  dismiss(id: string): void {
    this.errorsSignal.update((prev) => prev.filter((e) => e.id !== id));
  }

  clearAll(): void {
    this.errorsSignal.set([]);
  }

  private parseProblem(raw: ProblemDetailShape): ProblemDetailShape & { violations?: ValidationViolation[] } {
    if (!raw) return {};
    const violations: ValidationViolation[] = Array.isArray((raw as any).violations)
      ? (raw as any).violations
      : undefined;
    return {
      type: raw.type,
      title: raw.title,
      status: raw.status,
      detail: raw.detail,
      instance: raw.instance,
      errorCode: raw.errorCode,
      violations,
      error: raw.error,
      message: raw.message,
    };
  }

  private makeError(
    type: AppError['type'],
    message: string,
    title: string,
    status?: number,
    field?: string,
  ): AppError {
    return {
      id: `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      message,
      status,
      field,
      timestamp: Date.now(),
    };
  }

  private mapErrorType(status: number, typeUrl: string): AppError['type'] {
    if (typeUrl.includes('validation')) return 'validation';
    if (status === 401 || status === 403 || typeUrl.includes('unauthorized') || typeUrl.includes('forbidden'))
      return 'auth';
    if (status >= 400 && status < 500 && (typeUrl.includes('business') || status === 409 || status === 422))
      return 'business';
    if (status >= 500) return 'server';
    return 'unknown';
  }

  private fallbackTitle(status: number): string {
    switch (status) {
      case 400:
        return 'Requête invalide';
      case 401:
        return 'Session expirée';
      case 403:
        return 'Accès interdit';
      case 404:
        return 'Ressource introuvable';
      case 409:
        return 'Conflit';
      case 422:
        return 'Données invalides';
      case 429:
        return 'Trop de requêtes';
      default:
        return status >= 500 ? 'Erreur serveur' : 'Erreur';
    }
  }
}
