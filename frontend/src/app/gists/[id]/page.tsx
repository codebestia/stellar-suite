"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  Calendar,
  User,
  Tag,
  FileCode2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Gist {
  id: string;
  title: string;
  description: string;
  author: string;
  date: string;
  language: string;
  tags: string[];
  code: string;
}

const MOCK_GISTS: Record<string, Gist> = {
  "hello-world-soroban": {
    id: "hello-world-soroban",
    title: "Hello World Soroban Contract",
    description:
      "A minimal Soroban smart contract that stores and retrieves a greeting string on the Stellar network.",
    author: "stellar-dev",
    date: "2026-05-15",
    language: "Rust",
    tags: ["soroban", "beginner", "storage"],
    code: `#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol, String};

const GREETING_KEY: Symbol = symbol_short!("greeting");

#[contract]
pub struct HelloContract;

#[contractimpl]
impl HelloContract {
    pub fn set_greeting(env: Env, greeting: String) {
        env.storage().instance().set(&GREETING_KEY, &greeting);
    }

    pub fn get_greeting(env: Env) -> String {
        env.storage()
            .instance()
            .get(&GREETING_KEY)
            .unwrap_or(String::from_str(&env, "Hello, Stellar!"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn test_greeting() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);

        client.set_greeting(&String::from_str(&env, "Hello, World!"));
        assert_eq!(
            client.get_greeting(),
            String::from_str(&env, "Hello, World!")
        );
    }
}`,
  },
  "token-contract": {
    id: "token-contract",
    title: "Stellar Token Contract (SEP-41)",
    description:
      "A compliant SEP-41 fungible token contract with mint, burn, and transfer capabilities.",
    author: "soroban-wizard",
    date: "2026-05-22",
    language: "Rust",
    tags: ["soroban", "token", "sep-41", "defi"],
    code: `#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Symbol,
};

#[contracttype]
pub enum DataKey {
    Balance(Address),
    Allowance(Address, Address),
    TotalSupply,
    Admin,
}

#[contract]
pub struct TokenContract;

#[contractimpl]
impl TokenContract {
    pub fn initialize(env: Env, admin: Address, total_supply: i128) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TotalSupply, &total_supply);
        env.storage().instance().set(&DataKey::Balance(admin.clone()), &total_supply);
    }

    pub fn balance(env: Env, account: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Balance(account))
            .unwrap_or(0)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        let from_balance = Self::balance(env.clone(), from.clone());
        assert!(from_balance >= amount, "Insufficient balance");
        env.storage()
            .instance()
            .set(&DataKey::Balance(from), &(from_balance - amount));
        let to_balance = Self::balance(env.clone(), to.clone());
        env.storage()
            .instance()
            .set(&DataKey::Balance(to), &(to_balance + amount));
    }
}`,
  },
  "nft-contract": {
    id: "nft-contract",
    title: "Non-Fungible Token (NFT) Contract",
    description:
      "A basic NFT contract on Soroban supporting minting, ownership queries, and transfers.",
    author: "nft-builder",
    date: "2026-05-28",
    language: "Rust",
    tags: ["soroban", "nft", "collectibles"],
    code: `#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, Map, String, Vec,
};

#[contracttype]
pub enum DataKey {
    Owner(u64),
    TokenURI(u64),
    TokenCount,
}

#[contract]
pub struct NftContract;

#[contractimpl]
impl NftContract {
    pub fn mint(env: Env, to: Address, uri: String) -> u64 {
        to.require_auth();
        let token_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TokenCount)
            .unwrap_or(0)
            + 1;

        env.storage()
            .instance()
            .set(&DataKey::Owner(token_id), &to);
        env.storage()
            .instance()
            .set(&DataKey::TokenURI(token_id), &uri);
        env.storage()
            .instance()
            .set(&DataKey::TokenCount, &token_id);

        token_id
    }

    pub fn owner_of(env: Env, token_id: u64) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Owner(token_id))
            .expect("Token does not exist")
    }

    pub fn token_uri(env: Env, token_id: u64) -> String {
        env.storage()
            .instance()
            .get(&DataKey::TokenURI(token_id))
            .expect("Token does not exist")
    }
}`,
  },
};

const FALLBACK_GIST: Gist = {
  id: "not-found",
  title: "Gist Not Found",
  description: "This gist does not exist or has been removed.",
  author: "unknown",
  date: new Date().toISOString().split("T")[0],
  language: "Rust",
  tags: [],
  code: "// No content available.",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function CodeViewer({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-destructive/60" />
          <span className="h-3 w-3 rounded-full bg-yellow-400/60" />
          <span className="h-3 w-3 rounded-full bg-green-500/60" />
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold font-display text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code block */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="group hover:bg-primary/5">
                <td className="select-none w-12 px-4 py-0 text-right text-xs text-muted-foreground/40 group-hover:text-muted-foreground/60 border-r border-border/50 align-top leading-6">
                  {index + 1}
                </td>
                <td className="px-4 py-0 text-foreground/90 whitespace-pre leading-6">
                  {line || " "}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function GistPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const gist = MOCK_GISTS[id] ?? FALLBACK_GIST;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main
        id="main-content"
        className="pt-20 pb-20 px-4 sm:pt-24 sm:px-6"
      >
        <div className="mx-auto max-w-4xl">
          {/* Back */}
          <Link
            href="/gists"
            className="inline-flex items-center gap-1.5 text-sm font-body text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to gists
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-4">
              <FileCode2 className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold tracking-tight text-foreground mb-3">
              {gist.title}
            </h1>
            <p className="text-base font-body text-muted-foreground leading-relaxed max-w-2xl">
              {gist.description}
            </p>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-border">
            <div className="flex items-center gap-1.5 text-sm font-body text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="text-foreground font-medium">
                {gist.author}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-body text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formatDate(gist.date)}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-body text-muted-foreground">
              <FileCode2 className="h-4 w-4" />
              {gist.language}
            </div>
            {gist.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1.5">
                  {gist.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-semibold font-display text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Code viewer */}
          <CodeViewer code={gist.code} />
        </div>
      </main>

      <Footer />
'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Copy, 
  Share2, 
  Code, 
  User, 
  Calendar, 
  Tag, 
  ChevronRight,
  Eye,
  Github
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const MOCK_GIST = {
  id: 'gist-123',
  title: 'Basic Escrow Implementation',
  description: 'A simple escrow contract that holds funds until both parties agree to release.',
  author: '0xVida',
  date: 'Oct 24, 2023',
  tags: ['Smart Contract', 'Soroban', 'Escrow'],
  views: '1.2k',
  code: `// Soroban Escrow Contract
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol};

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn initialize(env: Env, buyer: Address, seller: Address, amount: i128) {
        // Initialization logic here
    }

    pub fn deposit(env: Env, from: Address) {
        // Deposit funds into escrow
    }

    pub fn release(env: Env) {
        // Release funds to seller
    }

    pub fn refund(env: Env) {
        // Refund funds to buyer
    }
}`,
};

export default function GistViewerPage({ params }: { params: { id: string } }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(MOCK_GIST.code);
    toast.success('Code copied to clipboard!');
  };

  const handleShare = () => {
    toast.info('Link copied to clipboard!', {
      description: 'You can now share this gist with others.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="border-b bg-muted/30 py-4 px-6 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search gists by name, author, or tags..." 
              className="pl-10 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="ghost" className="hidden md:flex">Browse All</Button>
          <Button>New Gist</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Info */}
        <div className="space-y-6 lg:col-span-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Gists</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{params.id || MOCK_GIST.id}</span>
            </div>
            <h1 className="text-2xl font-bold">{MOCK_GIST.title}</h1>
            <p className="text-muted-foreground text-sm">{MOCK_GIST.description}</p>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{MOCK_GIST.author}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Created {MOCK_GIST.date}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{MOCK_GIST.views} views</span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Tag className="h-3 w-3" /> Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {MOCK_GIST.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Button variant="outline" className="w-full justify-start gap-2" onClick={handleShare}>
            <Share2 className="h-4 w-4" /> Share Gist
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Github className="h-4 w-4" /> View on GitHub
          </Button>
        </div>

        {/* Code Viewer */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="overflow-hidden border-2 shadow-sm">
            <CardHeader className="bg-muted/50 border-b py-3 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                <span className="font-mono text-xs font-semibold">escrow.rs</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyCode} className="h-8 px-2">
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-[#0d1117] p-6 overflow-x-auto">
                <pre className="font-mono text-sm leading-relaxed text-slate-300">
                  <code>
                    {MOCK_GIST.code.split('\n').map((line, i) => (
                      <div key={i} className="flex gap-4 group">
                        <span className="w-8 text-slate-600 text-right select-none">{i + 1}</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Discussion Mock */}
          <div className="pt-8 space-y-4">
            <h3 className="text-lg font-bold">Discussion</h3>
            <div className="bg-muted/30 rounded-lg p-8 text-center border-2 border-dashed">
              <p className="text-muted-foreground">Sign in to join the conversation.</p>
              <Button variant="outline" className="mt-4">Login with GitHub</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
