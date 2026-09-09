import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const ignored=new Set(["node_modules","dist",".git","coverage"]);
const textExt=new Set([".ts",".tsx",".js",".jsx",".json",".yml",".yaml",".md",".env",".html"]);
const findings:{severity:"HIGH"|"MEDIUM";file:string;message:string}[]=[];

function walk(dir:string){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(ignored.has(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full);
    else if(textExt.has(path.extname(entry.name))||entry.name.startsWith(".env")){
      let text="";try{text=fs.readFileSync(full,"utf8")}catch{continue}
      const rel=path.relative(root,full);
      const checks:[RegExp,"HIGH"|"MEDIUM",string][]=[
        [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,"HIGH","Private key material found in repository"],
        [/AKIA[0-9A-Z]{16}/,"HIGH","Possible AWS access key found"],
        [/AIza[0-9A-Za-z_-]{30,}/,"HIGH","Possible Google API key found"],
        [/sk_live_[0-9A-Za-z]{16,}/,"HIGH","Possible live payment secret found"],
        [/rzp_live_[0-9A-Za-z_-]{10,}/,"HIGH","Possible live payment credential found"],
        [/password\s*[:=]\s*["'][^"']{8,}["']/i,"HIGH","Hardcoded password-like value found"],
        [/secret\s*[:=]\s*["'][^"']{16,}["']/i,"MEDIUM","Hardcoded secret-like value found"],
        [/api[-_]?key\s*[:=]\s*["'][^"']{16,}["']/i,"MEDIUM","Hardcoded API-key-like value found"],
        [/console\.log\s*\(/,"MEDIUM","console.log found; use structured/error logging in production"]
      ];
      for(const [pattern,severity,message] of checks){
        if(pattern.test(text)&&!rel.endsWith(".env.example"))findings.push({severity,file:rel,message});
      }
    }
  }
}

walk(root);
const unique=[...new Map(findings.map(x=>[`${x.severity}:${x.file}:${x.message}`,x])).values()];
console.log(`Production audit: scanned repository; ${unique.length} finding(s).`);
for(const f of unique)console.log(`[${f.severity}] ${f.file}: ${f.message}`);
const high=unique.filter(x=>x.severity==="HIGH");
if(high.length){console.error(`Production audit failed: ${high.length} high-severity finding(s).`);process.exit(1)}
if(unique.length)console.log("No high-severity repository secret findings. Medium findings require manual review.");
else console.log("Production audit passed: no configured findings detected.");
