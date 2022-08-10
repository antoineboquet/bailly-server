# bailly-server

> Ce dépôt contient uniquement le serveur de l'application Bailly. Le client se trouve dans le dépôt [bailly.app](https://github.com/antoineboquet/bailly.app).

Veuillez noter que la base de données utilisée par le serveur n'est PAS distribuée dans ce dépôt. Si vous cherchez à faire fonctionner le serveur par vous-même, vous devrez d'abord convertir les données du [Bailly 2020 Hugo Chávez](http://gerardgreco.free.fr/spip.php?article52) dans le format spécifié au sein du code source.

## Utilisation avec Docker
###Création de l'image
Dans les prochaines mise à jours de Docker, il sera possible d'utiliser directement le repository git au lieu de copier les fichiers depuis le système local ([source](https://docs.docker.com/engine/reference/builder/#adding-a-git-repository-add-git-ref-dir)). En attendant cette fonctionnalité, la construction de l'image utilise l'ancien système. Pour construire l'image, utilisez la commande suivante:
```shell script
docker build -t NOM_IMAGE --build-arg port=XXXX .
```
Remplacez `NOM_IMAGE` et `XXXX` respectivement par le nom de l'image souhaité et le numéro de port désiré pour exposer le container.
Si vous ne souhaitez pas spécifier une valeur, vous pouvez ignorer ce dernier argument et la valeur par défaut (`3000`) sera utilisée à la place. La commande deviendra:
```shell script
docker build -t NOM_IMAGE .
```
### Lancement du container:
Utilisez la commande suivante pour créer le container:
```shell script
docker run -P NOM_IMAGE
```
Remplacez `NOM_IMAGE` par le nom de l'image utilisée à l'étape précédente.



## Licence

Copyright (C) 2021  Antoine Boquet, Benjamin Georges

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see https://www.gnu.org/licenses/agpl-3.0.fr.html.

### Données

Cette application utilise les données du [Bailly 2020 Hugo Chávez](http://gerardgreco.free.fr/spip.php?article52) (Gérard Gréco, André Charbonnet, Mark De Wilde, Bernard Maréchal & contributeurs), distribuées sous licence Creative Commons Attribution - Pas d'Utilisation Commerciale - Pas de Modification — « CC BY-NC-ND 4.0 ».
