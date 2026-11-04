import { useState, useCallback } from 'react';
import { ValidationRule, extractBackendErrors } from '../utils/validation';

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]> | ValidationRule<T[K]>[];
};

export interface UseFormValidationOptions<T> {
  initialValues: T;
  validationSchema?: ValidationSchema<T>;
  onSubmit?: (values: T) => Promise<void> | void;
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validationSchema = {},
  onSubmit,
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * Validate a single field with its configured rule(s)
   */
  const validateField = useCallback(
    <K extends keyof T>(field: K, val: T[K], currentValues = values): string | null => {
      const ruleOrRules = validationSchema[field];
      if (!ruleOrRules) return null;

      const rules = Array.isArray(ruleOrRules) ? ruleOrRules : [ruleOrRules];
      for (const rule of rules) {
        const error = rule(val, currentValues);
        if (error) return error;
      }
      return null;
    },
    [validationSchema, values]
  );

  /**
   * Update field value and re-validate if field was already touched
   */
  const setFieldValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues((prev) => {
        const updated = { ...prev, [field]: value };
        if (touched[field]) {
          const err = validateField(field, value, updated);
          setErrors((prevErr) => {
            const nextErr = { ...prevErr };
            if (err) {
              nextErr[field] = err;
            } else {
              delete nextErr[field];
            }
            return nextErr;
          });
        }
        return updated;
      });
      setSubmitError(null);
    },
    [touched, validateField]
  );

  /**
   * Input change event handler
   */
  const handleChange = useCallback(
    (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const target = e.target;
      const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
      setFieldValue(field, value as unknown as T[keyof T]);
    },
    [setFieldValue]
  );

  /**
   * Input blur event handler: marks field as touched and computes error
   */
  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const err = validateField(field, values[field], values);
      setErrors((prevErr) => {
        const nextErr = { ...prevErr };
        if (err) {
          nextErr[field] = err;
        } else {
          delete nextErr[field];
        }
        return nextErr;
      });
    },
    [validateField, values]
  );

  /**
   * Set field error manually (e.g. from backend response)
   */
  const setFieldError = useCallback((field: keyof T, error: string | null) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });
  }, []);

  /**
   * Validate entire form: returns true if valid, false if invalid
   */
  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    let hasError = false;

    for (const key of Object.keys(validationSchema) as (keyof T)[]) {
      allTouched[key] = true;
      const err = validateField(key, values[key], values);
      if (err) {
        newErrors[key] = err;
        hasError = true;
      }
    }

    setTouched((prev) => ({ ...prev, ...allTouched }));
    setErrors(newErrors);
    return !hasError;
  }, [validationSchema, validateField, values]);

  /**
   * Internal submit execution logic with duplicate submission prevention & backend error mapping
   */
  const executeSubmit = useCallback(
    async (handler?: (vals: T) => Promise<void> | void, e?: React.FormEvent) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }

      // Prevent duplicate submit while already in-flight
      if (isSubmitting) return;

      setSubmitError(null);
      const isValid = validateAll();
      if (!isValid) return;

      const submitFn = handler || onSubmit;
      if (!submitFn) return;

      setIsSubmitting(true);
      try {
        await submitFn(values);
      } catch (err: any) {
        const { fieldErrors, generalError } = extractBackendErrors(err);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
          const touchedUpdates: Partial<Record<keyof T, boolean>> = {};
          for (const k of Object.keys(fieldErrors)) {
            touchedUpdates[k as keyof T] = true;
          }
          setTouched((prev) => ({ ...prev, ...touchedUpdates }));
        }
        if (generalError) {
          setSubmitError(generalError);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, onSubmit, validateAll, values]
  );

  /**
   * Versatile handleSubmit: works both as direct event handler: <form onSubmit={form.handleSubmit}>
   * or as higher-order callback: <form onSubmit={form.handleSubmit(customFn)}>
   * or called with empty arguments: <form onSubmit={form.handleSubmit()}>
   */
  const handleSubmit = useCallback(
    (arg?: React.FormEvent<HTMLFormElement> | ((vals: T) => Promise<void> | void)) => {
      if (arg && typeof arg === 'object' && 'preventDefault' in arg) {
        return executeSubmit(onSubmit, arg);
      }
      return (e?: React.FormEvent) => executeSubmit(typeof arg === 'function' ? arg : onSubmit, e);
    },
    [executeSubmit, onSubmit]
  ) as {
    (): (e?: React.FormEvent) => Promise<void>;
    (e: React.FormEvent<HTMLFormElement>): Promise<void>;
    (customSubmitHandler?: (vals: T) => Promise<void> | void): (e?: React.FormEvent) => Promise<void>;
  };

  /**
   * Reset form back to initial or specified values
   */
  const resetForm = useCallback((nextValues = initialValues) => {
    setValues(nextValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitError(null);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    setValues,
    setFieldValue,
    handleChange,
    handleBlur,
    setFieldError,
    setSubmitError,
    validateField,
    validateAll,
    handleSubmit,
    resetForm,
    reset: resetForm,
  };
}
