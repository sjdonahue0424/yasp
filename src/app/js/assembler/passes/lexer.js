if (typeof yasp == "undefined") yasp = { };

(function() {
    var splitter = " \t,\n;:";
    var deadSplitter = " \t";
    var commentSplitter = ';';

    var validLabel = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_";
    var validByteRegisters = [];
    for (var i = 0; i < 32; i++) {
        validByteRegisters.push("B"+i);
    }
    var validWordRegisters = [];
    for (var i = 0; i < 16; i++) {
        validWordRegisters.push("W"+i);
    }


    /**
     * @class Tokenizes (= Lexer) all the tokens
     */
    yasp.Lexer = function() {
        this.tokens = [];
    };

    /**
     * Does the tokenize step
     * @param assembler The assembler in which it is executed
     * @param input What should be tokenized?
     * @returns {Array}
     */
    yasp.Lexer.prototype.pass = function(assembler, input) {
        var lastFound = 0;
        var line = 0;
        var char = 0;

        for (var i = 0; i < input.length; i++) {
            var token = input.charAt(i);
            if (splitter.indexOf(token) != -1) {
                var text = input.substring(lastFound, i);
                this.newToken(new yasp.Token(text, line, char - text.length));

                if (token == commentSplitter) {
                    while (input.charAt(i) != '\n' && i < input.length) i++;
                } else {
                    this.newToken(new yasp.Token(token, line, char));
                }

                lastFound = i + 1;
            }

            char++;
            if (input.charAt(i) == '\n') {
                line++;
                char = 0;
            }
        }
        if (lastFound < input.length) {
            var text = input.substring(lastFound, i);
            this.newToken(new yasp.Token(text, line, char - text.length));
        }

        return this.tokens;
    };

    /**
     * Creates a new token and adds it to the token array list
     * If the token is either empty or in the deadSplitter array it is not added to the array
     * @param token Which token should be added
     */
    yasp.Lexer.prototype.newToken = function(token) {
        if (!!token && token.text.length > 0 && deadSplitter.indexOf(token.text) == -1) {
            this.tokens.push(token);
        }
    };

    yasp.TokenType = {
        COMMAND: "command",
        LABEL: "label",
        BYTE_LITERAL: "byte literal",
        WORD_LITERAL: "word literal",
        BYTE_REGISTER: "byte register",
        WORD_REGISTER: "word register",
        UNKNOWN: "unknown"
    }

    /**
     * A Token representing an atomic group of characters in the assembler code
     * @param text The content of the token
     * @param line The line in which this token is (used for error messages)
     * @param char The character where exactly this token is (used for error messages)
     * @constructor
     */
    yasp.Token = function(text, line, char) {
        this.text = text;
        this.line = line;
        this.char = char;
    };

    /**
     * @function Returns the type of this Token (Literal, Label, ...)
     */
    yasp.Token.prototype.getType = function() {
        // TODO: optimize this function => cache values and dont iterate through everything
        var name = this.text.toUpperCase();

        if (!isNaN(name)) {
            // what num?
            var num = parseInt(this.text);
            if (num < Math.pow(2, 8)) {
                return yasp.TokenType.BYTE_LITERAL;
            } else if (num < Math.pow(2, 16)){
                return yasp.TokenType.WORD_LITERAL;
            } else {
                return yasp.TokenType.UNKNOWN;
            }
        }

        // am i a byte register
        for (var i = 0; i < validByteRegisters.length; i++) {
            if (validByteRegisters[i] == name) return yasp.TokenType.BYTE_REGISTER;
        }

        // am i a word register
        for (var i = 0; i < validWordRegisters.length; i++) {
            if (validWordRegisters[i] == name) return yasp.TokenType.WORD_REGISTER;
        }

        // am i a command?
        for (var i = 0; i < yasp.commands.length; i++) {
            if (yasp.commands[i].name.toUpperCase() == name) return yasp.TokenType.COMMAND;
        }

        // am i a label?
        var amILabel= true;
        for (var i = 0; i < this.text.length; i++) {
            if (validLabel.indexOf(name.charAt(i)) == -1) {
                amILabel = false;
                break;
            }
        }
        return amILabel ? yasp.TokenType.LABEL : yasp.TokenType.UNKNOWN;
    };

    /**
     * Returns the string representation of a token. This should only be used for testing purpose
     * @returns {string}
     */
    yasp.Token.prototype.toString = function() {
        return "'" + (this.text == '\n' ? "NEWLINE" : this.text) + "'\n";
    };
})();