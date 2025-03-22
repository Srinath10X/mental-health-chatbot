with (import <nixpkgs> { });

mkShell {
  buildInputs = [ pkgs.nodejs_20 ];

  shellHook = ''
    clear
    echo "Entered into  nix-shell"
    echo "With node v20.18.1 & npm v10.8.2"
  '';
}
