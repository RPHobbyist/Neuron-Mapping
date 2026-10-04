/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

type Check = (input: string) => string;
type Kind = 'createHTML' | 'createScript' | 'createScriptURL';

type Policy = Partial<Record<Kind, (input: string) => unknown>>;

interface TrustedTypesFactory {
    createPolicy: (name: string, rules: Partial<Record<Kind, Check>>) => Policy;
}

const policies = new Map<string, Policy | null>();

const getPolicy = (name: string, kind: Kind, check: Check): Policy | null => {
    if (!policies.has(name)) {
        const factory = typeof window === 'undefined'
            ? undefined
            : (window as unknown as { trustedTypes?: TrustedTypesFactory }).trustedTypes;
        let policy: Policy | null = null;
        try {
            policy = factory?.createPolicy ? factory.createPolicy(name, { [kind]: check }) : null;
        } catch (e) {
            console.error(`Trusted Types policy "${name}" could not be created:`, e);
        }
        policies.set(name, policy);
    }
    return policies.get(name) ?? null;
};

const trusted = (policyName: string, kind: Kind, check: Check, value: string): string =>
    (getPolicy(policyName, kind, check)?.[kind]?.(value) ?? check(value)) as string;

const EDITOR_TAGS = new Set(['b', 'i', 'u', 's', 'span', 'br']);
const TAG = /<(\/?)([a-zA-Z][\w-]*)([^<>]*)>/g;
const EDITOR_ATTRIBUTE = /\s+(?:style|data-font)="[^"]*"/g;

export const assertEditorHtml = (html: string): string => {
    const rest = html.replace(TAG, (tag, closing: string, name: string, attributes: string) => {
        const allowedAttributes = closing ? attributes.trim() === '' : attributes.replace(EDITOR_ATTRIBUTE, '').trim() === '';
        if (!EDITOR_TAGS.has(name.toLowerCase()) || !allowedAttributes) {
            throw new TypeError(`Unexpected markup in node editor content: ${tag}`);
        }
        return '';
    });
    if (rest.includes('<')) throw new TypeError('Unexpected markup in node editor content');
    return html;
};

const assertJson = (json: string): string => {
    JSON.parse(json);
    return json;
};

const anyXml: Check = (xml) => xml;

const assertServiceWorkerUrl: Check = (url) => {
    if (url !== '/sw.js') throw new TypeError(`Unexpected service worker URL: ${url}`);
    return url;
};

export const editorHtml = (html: string): string => trusted('node-editor-html', 'createHTML', assertEditorHtml, html);

export const importedXml = (xml: string): string => trusted('xml-import', 'createHTML', anyXml, xml);

export const jsonLdScript = (json: string): string => trusted('seo-jsonld', 'createScript', assertJson, json);

export const serviceWorkerScriptUrl = (url: string): string =>
    trusted('service-worker-url', 'createScriptURL', assertServiceWorkerUrl, url);
