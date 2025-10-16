class UmbNumericDropdown extends HTMLElement {
    constructor() {
        super();
        this._value = null;
        this._config = null;
        this._min = null;
        this._max = null;
        this._options = [];
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font: inherit; }
        .row { display: flex; gap: 0.5rem; align-items: center; }
        input[type="number"] { 
          padding: 0.4rem 0.5rem; 
          width: 150px;
          font: inherit;
          border: 1px solid #d8d7d9;
          border-radius: 3px;
        }
        input[type="number"].invalid { 
          border-color: #c94f4f;
          background-color: #fff5f5;
        }
        select { 
          padding: 0.4rem 0.5rem; 
          cursor: pointer;
          font: inherit;
        }
        .error { 
          color: #c94f4f; 
          font-size: 0.875rem; 
          margin: 0.25rem 0 0; 
        }
      </style>
      <div class="row">
        <input id="numInput" type="number" step="1" />
        <select id="dropdown"></select>
      </div>
      <p class="error" id="error" style="display: none;"></p>
    `;
    }

    get value() {
        return this._value ? JSON.stringify(this._value) : null;
    }

    set value(v) {
        const normalized = this._normalizeIncoming(v);
        if (JSON.stringify(this._value) === JSON.stringify(normalized)) return;
        this._value = normalized;
        this._render();
    }

    get config() { return this._config; }
    set config(cfg) {
        this._config = cfg;
        this._min = this._readConfig("min", null);
        this._max = this._readConfig("max", null);

        const optionsConfig = this._readConfig("options", null);
        this._options = this._parseOptions(optionsConfig);

        this._render();
    }

    connectedCallback() {
        this._numInput = this.shadowRoot.getElementById("numInput");
        this._dropdown = this.shadowRoot.getElementById("dropdown");
        this._output = this.shadowRoot.getElementById("output");
        this._error = this.shadowRoot.getElementById("error");

        // handle input change
        this._numInput.addEventListener("input", () => {
            const rawValue = this._numInput.value;
            const numValue = rawValue ? parseInt(rawValue, 10) : null;

            // Validate
            const validationError = this._validateNumber(numValue);

            if (validationError) {
                this._showError(validationError);
                this._numInput.classList.add("invalid");
                return;
            } else {
                this._hideError();
                this._numInput.classList.remove("invalid");
            }

            if (!this._value) {
                this._value = { number: numValue, selectedOption: null };
            } else {
                this._value.number = numValue;
            }

            this._updateOutput();
            this._emitChange();
        });

        this._dropdown.addEventListener("change", () => {
            const selectedValue = this._dropdown.value;

            if (!this._value) {
                this._value = { number: null, selectedOption: selectedValue };
            } else {
                this._value.selectedOption = selectedValue;
            }

            this._updateOutput();
            this._emitChange();
        });

        this._render();
    }

    _readConfig(alias, fallback) {
        const cfg = this._config;
        if (!cfg) return fallback;

        try {
            if (typeof cfg.getValueByAlias === "function") {
                const v = cfg.getValueByAlias(alias);
                return v != null ? v : fallback;
            }
        } catch { }

        if (Array.isArray(cfg)) {
            const hit = cfg.find(x => x && x.alias === alias);
            return hit && hit.value != null ? hit.value : fallback;
        }

        if (typeof cfg === "object") {
            const v = cfg[alias];
            return v != null ? v : fallback;
        }

        return fallback;
    }

    _parseOptions(optionsConfig) {
        if (!optionsConfig) return [];

        // if already an array 
        if (Array.isArray(optionsConfig)) {
            return optionsConfig
                .map(opt => {
                    if (typeof opt === "string") return opt;
                    if (typeof opt === "object" && opt.value) return opt.value;
                    return String(opt);
                })
                .filter(Boolean);
        }

        // string
        if (typeof optionsConfig === "string") {
            const lines = optionsConfig.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
            if (lines.length > 1) return lines;

            // comma-separated
            const commas = optionsConfig.split(",").map(s => s.trim()).filter(Boolean);
            if (commas.length > 1) return commas;

            // 1 value
            return [optionsConfig.trim()];
        }

        return [];
    }

    _normalizeIncoming(v) {
        if (v == null) return null;

        if (typeof v === "object" && ("number" in v || "selectedOption" in v)) {
            return {
                number: v.number != null ? parseInt(v.number, 10) : null,
                selectedOption: v.selectedOption || null
            };
        }

        // try parsing as JSON string
        const s = String(v).trim();
        if (!s) return null;

        try {
            const parsed = JSON.parse(s);
            return {
                number: parsed.number != null ? parseInt(parsed.number, 10) : null,
                selectedOption: parsed.selectedOption || null
            };
        } catch { }

        return null;
    }

    _render() {
        if (this._numInput) {
            if (this._min != null) {
                this._numInput.min = this._min;
            } else {
                this._numInput.removeAttribute("min");
            }

            if (this._max != null) {
                this._numInput.max = this._max;
            } else {
                this._numInput.removeAttribute("max");
            }

            this._numInput.value = this._value && this._value.number != null ? this._value.number : "";
        }

        if (this._dropdown) {
            //clear existing options
            this._dropdown.innerHTML = "";

            if (this._options.length === 0) {
                const opt = document.createElement("option");
                opt.value = "";
                opt.textContent = "No options configured";
                this._dropdown.appendChild(opt);
                this._dropdown.disabled = true;
            } else {
                this._dropdown.disabled = false;

                this._options.forEach(optValue => {
                    const opt = document.createElement("option");
                    opt.value = optValue;
                    opt.textContent = optValue;
                    this._dropdown.appendChild(opt);
                });

                //Set selected value or default to first
                if (this._value && this._value.selectedOption) {
                    this._dropdown.value = this._value.selectedOption;
                } else if (this._options.length > 0) {
                    this._dropdown.value = this._options[0];
                    //Initialize value with first option if not set
                    if (!this._value) {
                        this._value = { number: null, selectedOption: this._options[0] };
                    } else if (!this._value.selectedOption) {
                        this._value.selectedOption = this._options[0];
                    }
                }
            }
        }

        this._updateOutput();
    }

    _updateOutput() {
        if (this._output) {
            if (!this._value || (this._value.number == null && !this._value.selectedOption)) {
                this._output.textContent = "—";
            } else {
                const numPart = this._value.number != null ? this._value.number : "—";
                const optPart = this._value.selectedOption || "—";
                this._output.textContent = `${numPart} ${optPart}`;
            }
        }
    }

    _validateNumber(numValue) {
        if (numValue == null) {
            return null; // empty = valid
        }

        if (this._min != null && numValue < this._min) {
            return `Value must be at least ${this._min}`;
        }

        if (this._max != null && numValue > this._max) {
            return `Value must be no more than ${this._max}`;
        }

        return null; // Valid
    }

    _showError(message) {
        if (this._error) {
            this._error.textContent = message;
            this._error.style.display = "block";
        }
    }

    _hideError() {
        if (this._error) {
            this._error.style.display = "none";
            this._error.textContent = "";
        }
    }

    _emitChange() {
        const detail = { value: this._value || null };
        this.dispatchEvent(new CustomEvent("change", { bubbles: true, detail }));
        this.dispatchEvent(new CustomEvent("property-value-change", { bubbles: true, detail }));
    }
}

customElements.define("umb-numeric-dropdown", UmbNumericDropdown);