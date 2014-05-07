const fs = require("fs");
const path = require("path");

var version = require("../../package.json").libgit2.version;
var descriptor = require("./descriptor.json");
var libgit2 = require("./v" + version + ".json");

// This file was generated by @nkallen.
var legacy = require("./new.json");

// Extracted types.
var typeMap = require("./types.json");

// Structs or new types between v0.18 and v0.20.
typeMap.__proto__ = {
  "git_filter_mode_t": { cpp: "Number", js: "Number" },
  "const git_blame_hunk*": { cpp: "GitBlameHunk", js: "BlameHunk" },
  "git_filter *": { cpp: "GitFilter", js: "Filter" },
  "const git_status_entry *": { cpp: "StatusEntry", js: "StatusEntry" },
  "const git_index_name_entry *": {
    cpp: "IndexNameEntry", js: "IndexNameEntry" },

  // unsure
  "uint16_t": { cpp: "Integer", js: "Number" },
  "git_blame_options": { cpp: "Integer", js: "Number" },
  "git_blame_options *": { cpp: "Integer", js: "Number" },
  "git_buf *": { cpp: "Buf", js: "Buf" },
  "git_branch_iterator *": { cpp: "BranchIterator", js: "Iterator" },
  "git_branch_iterator **": { cpp: "BranchIterator", js: "Iterator" },
  "git_branch_t *": { cpp: "GitBranch", js: "Branch" }
};

var files = [];

function titleCase(str) {
  return str.split(/_|\//).map(function(val, index) {
    if (val.length) {
      return val[0].toUpperCase() + val.slice(1);
    }

    return val;
  }).join("");
}

function camelCase(str) {
  return str.split(/_|\//).map(function(val, index) {
    if (val.length) {
      return index >= 1 ? val[0].toUpperCase() + val.slice(1) : val;
    }

    return val;
  }).join("");
}

Object.keys(descriptor).forEach(function(fileName, index) {
  var file = descriptor[fileName];

  // Constants.
  file.filename = fileName + ".h";
  file.ignore = typeof file.ignore == "boolean" ? file.ignore : true;
  file.cppClassName = "Git" + titleCase(fileName);
  file.jsClassName = file.cppClassName;

  // Adjust to find the real the index.
  libgit2.files.some(function(currentFile, _index) {
    if (currentFile.filename === file.filename) {
      index = _index;
      return true;
    }
  });

  if (file.cType === undefined) {
    if (libgit2.files[index].functions.length) {
      file.cType = libgit2.files[index].functions[0].split("_").slice(0, 2).join("_");
    }
  }

  if (file.cType) {
    file.freeFunctionName = "git_" + fileName + "_free";
  }

  // Doesn't actually exist.
  if (libgit2.files[index].functions.indexOf(file.freeFunctionName) === -1) {
    delete file.freeFunctionName;
  }


  var legacyFile = legacy.filter(function(currentFile) {
    return currentFile.filename === file.filename;
  })[0] || {};

  if (file.jsClassName.indexOf("Git") === 0) {
    file.jsClassName = file.jsClassName.slice(3);
  }

  var uniqueTypes = [];

  var addType = function(arg) {
    if (!arg.type) { return; }
    if (arg.type.indexOf("git") === 0) {
      var val = arg.type.split(" ")[0].slice(4);

      if (uniqueTypes.indexOf(val) === -1 && descriptor[val]) {
        uniqueTypes.push(val);
      }
    }
  };

  libgit2.files[index].functions.forEach(function(functionName) {
    var funcDescriptor = libgit2.functions[functionName];

    var args = funcDescriptor.args || [];

    args.forEach(addType);
    addType(funcDescriptor.return.type);
  });

  file.dependencies = uniqueTypes.map(function(file) {
    return "../include/" + file + ".h"; 
  });

  /*

  // Add to the type's list if it's new.
  typeMap["const " + "git_" + fileName + " *"] =
  typeMap["const " + "git_" + fileName + " **"] =
  typeMap["git_" + fileName + " *"] =
  typeMap["git_" + fileName + " **"] =
  typeMap["git_" + fileName] = {
    cpp: file.cppClassName,
    js: file.jsClassName 
  };

  file.functions = libgit2.files[index].functions.map(function(functionName, index) {
    var funcDescriptor = libgit2.functions[functionName];
    var descriptor = legacyFile.functions ? legacyFile.functions[index] || {} : {};
    var cType = file.cType || "";

    if (!functionName || !funcDescriptor) { return; }

    descriptor.cFunctionName = functionName;

    var trimmedName = functionName.slice(cType.length + 1);

    descriptor.cppFunctionName = titleCase(trimmedName);
    descriptor.jsFunctionName = camelCase(trimmedName);

    // Add to the type's list if it's new.
    typeMap["const " + descriptor.cFunctionName + " *"] =
    typeMap[descriptor.cFunctionName + " *"] =
    typeMap[descriptor.cFunctionName] = {
      cpp: descriptor.cppFunctionName,
      js: descriptor.jsFunctionName 
    };

    var retVal = descriptor.return = {};
    retVal.ctype = funcDescriptor.return.type;

    var type = typeMap[retVal.ctype];
    retVal.cppClassName = type.cpp;
    retVal.jsClassName = type.js;

    var args = descriptor.args || [];
    var typeDescriptor = args.length ? args[0].type || "" : "";
    var isCtor = typeDescriptor.indexOf("**") === typeDescriptor.length - 2;
    descriptor.isConstructorMethod = isCtor;

    // Set the prototype method argument.
    descriptor.isPrototypeMethod = !descriptor.isConstructorMethod;

    descriptor.args = funcDescriptor.args.map(function(arg) {
      if (typeMap[arg.type]) {
        return {
          name: arg.name,
          cType: arg.type,
          cppClassName: typeMap[arg.type].cpp,
          jsClassName: typeMap[arg.type].js,
          comment: arg.comment
        };
      }

      return {};
    });

    return descriptor;
  });

  */
  files.push(file);
});

fs.writeFileSync(path.join(__dirname, "idefs.json"), 
  JSON.stringify(files, null, 2));
