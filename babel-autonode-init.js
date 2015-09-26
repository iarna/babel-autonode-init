#!/usr/bin/env node
'use strict'
var fs = require('fs')
var execFileSync = require('child_process').execFileSync
var escapeStringRegexp = require('escape-string-regexp')

// make sure we can read it
var initialPackageJson = JSON.parse(fs.readFileSync('package.json'))
var initialDeps = initialPackageJson.dependencies || {}
var initialDevDeps = initialPackageJson.devDependencies || {}

var toInstall = []
if (!initialDeps['babel'] && !initialDevDeps['babel']) toInstall.push('babel')
if (!initialDeps['babel-autonode'] && !initialDevDeps['babel-autonode']) toInstall.push('babel-autonode')

if (toInstall.length) {
  console.log('> installing ' + toInstall.join(', ') + ' (this may take a little while)')
  execFileSync('npm',['install', '--save-dev'].concat(toInstall), {stdio: 'inherit'})
}

// get the version updated by npm install
var packageJson = JSON.parse(fs.readFileSync('package.json'))

var scripts = packageJson.scripts = packageJson.scripts || {}

function appendScript (name, todo) {
  var matchesAppended = new RegExp(' && ' + escapeStringRegexp(todo) + '$')
  if (scripts[name] && scripts[name] !== todo && !matchesAppended.test(scripts[name])) {
    scripts[name] += ' && ' + todo
  } else if (scripts[name]) {
    return
  } else {
    scripts[name] = todo
  } 
  console.log('> updating ' + name + ' to include: ' + todo)
}

appendScript('build', 'babel-autonode')
appendScript('prepublish', 'npm run build')
appendScript('prestart', 'npm run build')

if (!packageJson['babel-autonode.main']) {
  console.log("> changing entry point")
  packageJson['babel-autonode.main'] = packageJson.main || 'index.js'
  packageJson.main = 'loader.js'
}

console.log("> writing package.json")
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2))
console.log("> writing loader.js")
fs.writeFileSync('loader.js', "module.exports = require('babel-autonode/loader.js')\n")

console.log('> babel-autonode installed!')
