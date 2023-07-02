# Bizzllet-backend-task

## Potencijalna unapređenja:
- [X] Dodati timestamp prilikom šifrovanja poruke Load Balancera i prosleđivanja HTTP zahteva Cart servisu da bi zahtev bio validan u određenom vremenskom prozoru i da bi se sprečio replay napad.
  - [X] Dodati i prateće testove
- [ ] Deterministička implementacija WRR. Npr. ako su težine 8 i 2, da na svakih 10 zahteva jedan servis primi 8 a drugi 2 zahteva, umesto da verovatnoće za svaki zahtev pojedinačno budu 80% i 20%. Trade-off: nerazumljiviji kod!
