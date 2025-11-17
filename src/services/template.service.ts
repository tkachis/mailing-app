/**
 * Service for working with email templates
 * Supports replacing variables in curly braces with actual values
 */

export type TemplateVariable = {
  key: string;
  label: string;
  description?: string;
  group: 'user' | 'service';
};

export type TemplateVariableMap = Record<string, string>;

/**
 * User variables - available for use in UI
 */
const USER_VARIABLES: TemplateVariable[] = [
  {
    key: 'COMPANY_NAME',
    label: 'Company Name',
    description: 'Recipient company name',
    group: 'user',
  },
];

/**
 * Service variables - used automatically by the system
 */
const SERVICE_VARIABLES: TemplateVariable[] = [
  {
    key: 'UNSUBSCRIBE_LINK',
    label: 'Unsubscribe Link',
    description: 'Unsubscribe link for mailing list',
    group: 'service',
  },
];

/**
 * All available variables for templates
 */
const ALL_VARIABLES: TemplateVariable[] = [
  ...USER_VARIABLES,
  ...SERVICE_VARIABLES,
];

/**
 * Regular expression for finding variables in template
 */
const VARIABLE_REGEX = /@([A-Z_]+)/g;

/**
 * Regular expression for finding variable start (for autocompletion)
 */
const VARIABLE_START_REGEX = /@([A-Z_]*)$/;

/**
 * Regular expression for finding incomplete variable (for deletion)
 */
const VARIABLE_INCOMPLETE_REGEX = /@[A-Z_]*$/;

class TemplateService {
  /**
   * Replaces variables in template with values from the provided map
   * @param template - HTML template with variables via @
   * @param variables - Map of variables for replacement
   * @returns Template with replaced variables
   */
  replaceTemplateVariables(
    template: string,
    variables: TemplateVariableMap,
  ): string {
    return template.replace(VARIABLE_REGEX, (match, variableName) => {
      const value = variables[variableName];
      return value !== undefined ? value : match;
    });
  }

  /**
   * Extracts all variables from template
   * @param template - HTML template
   * @returns Array of found variables
   */
  extractTemplateVariables(template: string): string[] {
    const matches = template.match(VARIABLE_REGEX);
    if (!matches) return [];

    return [...new Set(matches.map((match) => match.slice(1)))];
  }

  /**
   * Checks if template contains unknown variables
   * @param template - HTML template
   * @returns Array of unknown variables
   */
  validateTemplateVariables(template: string): string[] {
    const usedVariables = this.extractTemplateVariables(template);
    const knownVariables = ALL_VARIABLES.map((v) => v.key);

    return usedVariables.filter(
      (variable) => !knownVariables.includes(variable),
    );
  }

  /**
   * Gets list of user variables for autocompletion
   * @returns Array of user variables
   */
  getUserVariables(): TemplateVariable[] {
    return USER_VARIABLES;
  }

  /**
   * Gets list of service variables
   * @returns Array of service variables
   */
  getServiceVariables(): TemplateVariable[] {
    return SERVICE_VARIABLES;
  }

  /**
   * Gets list of all available variables
   * @returns Array of all variables
   */
  getAllVariables(): TemplateVariable[] {
    return ALL_VARIABLES;
  }

  /**
   * Gets list of available variables for autocompletion (user-only)
   * @returns Array of user variables
   */
  getAvailableVariables(): TemplateVariable[] {
    return this.getUserVariables();
  }

  /**
   * Checks if user is starting to type a variable
   * @param text - Text to check
   * @returns Search result or null
   */
  findVariableStart(text: string): RegExpMatchArray | null {
    return text.match(VARIABLE_START_REGEX);
  }

  /**
   * Checks if there is an incomplete variable for deletion
   * @param text - Text to check
   * @returns Search result or null
   */
  findIncompleteVariable(text: string): RegExpMatchArray | null {
    return text.match(VARIABLE_INCOMPLETE_REGEX);
  }
}

const templateService = new TemplateService();

export default templateService;
