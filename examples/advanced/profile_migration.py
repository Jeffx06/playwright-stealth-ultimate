#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
from pathlib import Path

# Ajouter le chemin du projet avant toute importation locale
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

"""
Exemple avancé : Migration de profils

Ce script démontre la migration de profils entre différentes versions
du framework Playwright Stealth.

Niveau : Avancé
Temps estimé : 15-20 minutes

Fonctionnalités :
- Création de profils dans différentes versions
- Migration automatique entre versions (V1.0 → V1.1 → V2.0)
- Validation après migration
- Comparaison avant/après migration
- Gestion des erreurs de migration
- Sauvegarde et chargement des profils migrés
- Export/Import JSON

Compatibilité : Python 3.10+
"""

import json
import time
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime

# =============================================================================
# IMPORTS DU FRAMEWORK
# =============================================================================

from core.profile import FingerprintProfile, HardwareTier, OSType, BrowserVendor
from migration.engine import MigrationEngine, SchemaVersion


# =============================================================================
# 1. GESTIONNAIRE DE PROFILS
# =============================================================================

class ProfileManager:
    """
    Gestionnaire de profils avec support de migration.
    """

    def __init__(self):
        self._engine = MigrationEngine(preserve_original=True)
        self._profiles: Dict[str, Dict[str, Any]] = {}
        self._version_history: Dict[str, List[Tuple[str, float]]] = {}

    def create_profile(
        self,
        profile_id: str,
        version: SchemaVersion,
        data: Dict[str, Any]
    ) -> None:
        """
        Crée un nouveau profil dans une version spécifique.

        Args:
            profile_id: Identifiant unique du profil
            version: Version du schéma
            data: Données du profil
        """
        # Valider les données
        if not data.get('hardware') and not data.get('browser'):
            raise ValueError("Données de profil invalides: 'hardware' et 'browser' requis")

        # Ajouter des métadonnées
        data['created_at'] = datetime.now().isoformat()
        data['version'] = str(version.value)

        # Stocker le profil
        self._profiles[profile_id] = {
            'version': version,
            'data': data
        }

        # Enregistrer l'historique
        if profile_id not in self._version_history:
            self._version_history[profile_id] = []
        self._version_history[profile_id].append(('created', time.time()))

        print(f"✅ Profil '{profile_id}' créé (version {version})")

    def migrate_profile(
        self,
        profile_id: str,
        target_version: SchemaVersion
    ) -> Optional[Dict[str, Any]]:
        """
        Migre un profil vers une version cible.

        Args:
            profile_id: Identifiant du profil
            target_version: Version cible

        Returns:
            Optional[Dict[str, Any]]: Profil migré ou None
        """
        if profile_id not in self._profiles:
            print(f"❌ Profil '{profile_id}' non trouvé")
            return None

        profile = self._profiles[profile_id]
        current_version = profile['version']
        data = profile['data']

        print(f"🔄 Migration du profil '{profile_id}' de {current_version} à {target_version}...")

        # Vérifier si la migration est nécessaire
        if current_version == target_version:
            print(f"   ⚠️ Le profil est déjà en version {target_version}")
            return data

        try:
            # Exécuter la migration
            migrated_data = self._engine.migrate(
                data,
                from_version=current_version,
                to_version=target_version
            )

            # Mettre à jour les métadonnées
            migrated_data['migrated_at'] = datetime.now().isoformat()
            migrated_data['version'] = str(target_version.value)
            migrated_data['original_version'] = str(current_version.value)

            # Mettre à jour le profil
            self._profiles[profile_id] = {
                'version': target_version,
                'data': migrated_data
            }

            # Enregistrer l'historique
            self._version_history[profile_id].append(
                (f'migrated_{current_version}_to_{target_version}', time.time())
            )

            print(f"✅ Migration réussie vers {target_version}")
            return migrated_data

        except Exception as e:
            print(f"❌ Erreur lors de la migration: {e}")
            return None

    def get_profile(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """Récupère un profil par son ID."""
        if profile_id in self._profiles:
            return self._profiles[profile_id]['data']
        return None

    def get_profile_version(self, profile_id: str) -> Optional[SchemaVersion]:
        """Récupère la version d'un profil."""
        if profile_id in self._profiles:
            return self._profiles[profile_id]['version']
        return None

    def get_history(self, profile_id: str) -> List[Tuple[str, float]]:
        """Récupère l'historique d'un profil."""
        return self._version_history.get(profile_id, [])

    def export_profile(self, profile_id: str, path: str) -> bool:
        """
        Exporte un profil vers un fichier JSON.

        Args:
            profile_id: Identifiant du profil
            path: Chemin du fichier de sortie

        Returns:
            bool: True si l'export a réussi
        """
        profile = self.get_profile(profile_id)
        if not profile:
            print(f"❌ Profil '{profile_id}' non trouvé")
            return False

        export_data = {
            'id': profile_id,
            'version': self.get_profile_version(profile_id).value,
            'data': profile,
            'exported_at': datetime.now().isoformat()
        }

        with open(path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)

        print(f"✅ Profil '{profile_id}' exporté vers {path}")
        return True

    def import_profile(self, path: str) -> Optional[str]:
        """
        Importe un profil depuis un fichier JSON.

        Args:
            path: Chemin du fichier

        Returns:
            Optional[str]: ID du profil importé ou None
        """
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            profile_id = data.get('id')
            if not profile_id:
                print("❌ ID du profil manquant dans le fichier")
                return None

            version = data.get('version', 100)  # V1.0 par défaut
            profile_data = data.get('data', {})

            # Créer le profil
            self._profiles[profile_id] = {
                'version': SchemaVersion(version),
                'data': profile_data
            }

            print(f"✅ Profil '{profile_id}' importé depuis {path}")
            return profile_id

        except Exception as e:
            print(f"❌ Erreur lors de l'import: {e}")
            return None

    def list_profiles(self) -> List[str]:
        """Liste les IDs des profils."""
        return list(self._profiles.keys())

    def compare_profiles(
        self,
        profile_id: str,
        version1: SchemaVersion,
        version2: SchemaVersion
    ) -> Dict[str, Any]:
        """
        Compare un profil entre deux versions.

        Args:
            profile_id: Identifiant du profil
            version1: Première version
            version2: Deuxième version

        Returns:
            Dict[str, Any]: Différences entre les versions
        """
        profile = self.get_profile(profile_id)
        if not profile:
            return {'error': f"Profil '{profile_id}' non trouvé"}

        # Simuler la migration vers les deux versions
        data_v1 = self._engine.migrate(profile, version1, version1)
        data_v2 = self._engine.migrate(profile, version2, version2)

        # Comparer les structures
        diff = {
            'profile_id': profile_id,
            'version1': version1,
            'version2': version2,
            'keys_added': [],
            'keys_removed': [],
            'keys_changed': [],
            'values_changed': {}
        }

        # Comparaison simple des clés
        keys1 = set(self._flatten_keys(data_v1))
        keys2 = set(self._flatten_keys(data_v2))

        diff['keys_added'] = list(keys2 - keys1)
        diff['keys_removed'] = list(keys1 - keys2)
        diff['keys_changed'] = list(keys1 & keys2)

        # Comparer les valeurs pour les clés communes
        for key in diff['keys_changed']:
            val1 = self._get_nested_value(data_v1, key)
            val2 = self._get_nested_value(data_v2, key)
            if val1 != val2:
                diff['values_changed'][key] = {'from': val1, 'to': val2}

        return diff

    def _flatten_keys(self, obj: Any, prefix: str = '') -> List[str]:
        """Aplatit les clés d'un dictionnaire imbriqué."""
        keys = []
        if isinstance(obj, dict):
            for k, v in obj.items():
                new_prefix = f"{prefix}.{k}" if prefix else k
                keys.extend(self._flatten_keys(v, new_prefix))
        else:
            keys.append(prefix)
        return keys

    def _get_nested_value(self, obj: Any, path: str) -> Any:
        """Récupère une valeur imbriquée par chemin."""
        parts = path.split('.')
        current = obj
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None
        return current


# =============================================================================
# 2. UTILITAIRES DE GÉNÉRATION DE PROFILS
# =============================================================================

def generate_sample_profile_v1_0() -> Dict[str, Any]:
    """Génère un profil d'exemple en version 1.0."""
    return {
        'hardware': {
            'cpu': 'Intel Core i5-1135G7',
            'cpu_cores': 4,
            'ram': 8,
            'gpu': 'Intel Iris Xe Graphics'
        },
        'browser': {
            'platform': 'Win32',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'locale': 'en-US',
            'languages': ['en-US', 'en'],
            'timezone': 'America/New_York'
        }
    }


def generate_sample_profile_v1_1() -> Dict[str, Any]:
    """Génère un profil d'exemple en version 1.1."""
    return {
        'tier': 'medium',
        'hardware': {
            'cpu': 'Intel Core i5-1135G7',
            'cpu_cores': 4,
            'ram': 8,
            'gpu': 'Intel Iris Xe Graphics',
            'screen': [1920, 1080],
            'dpi': 1.0
        },
        'browser': {
            'platform': 'Win32',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'locale': 'en-US',
            'languages': ['en-US', 'en'],
            'timezone': 'America/New_York'
        },
        'modules': {
            'enabled': ['webdriver', 'chrome_runtime', 'canvas']
        }
    }


def generate_sample_profile_v2_0() -> Dict[str, Any]:
    """Génère un profil d'exemple en version 2.0."""
    return {
        'hardware': {
            'tier': 'high',
            'cpu': 'Intel Core i7-12700H',
            'cpu_cores': 8,
            'ram': 16,
            'gpu_model': 'NVIDIA GeForce RTX 3060',
            'screen': [2560, 1440],
            'dpi': 1.25
        },
        'browser': {
            'platform': 'Win32',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'locale': 'fr-FR',
            'languages': ['fr-FR', 'fr', 'en-US', 'en'],
            'timezone': 'Europe/Paris',
            'fonts': ['Arial', 'Helvetica', 'Times New Roman']
        },
        'modules': {
            'enabled': ['webdriver', 'chrome_runtime', 'canvas', 'audio', 'intl']
        },
        'policies': {
            'consistency': 'strict',
            'performance': 'balanced'
        },
        'metadata': {
            'created_at': datetime.now().isoformat()
        }
    }


# =============================================================================
# 3. MAIN
# =============================================================================

def main():
    """Point d'entrée principal."""
    print("=" * 70)
    print("🔄 Migration de profils - Playwright Stealth")
    print("=" * 70)
    print()

    # Créer le gestionnaire
    manager = ProfileManager()

    # 1. Créer des profils dans différentes versions
    print("📌 1. Création de profils")
    print("-" * 40)

    # Profil V1.0
    data_v1 = generate_sample_profile_v1_0()
    manager.create_profile(
        profile_id="profile_v1",
        version=SchemaVersion.V1_0,
        data=data_v1
    )

    # Profil V1.1
    data_v1_1 = generate_sample_profile_v1_1()
    manager.create_profile(
        profile_id="profile_v1_1",
        version=SchemaVersion.V1_1,
        data=data_v1_1
    )

    # Profil V2.0
    data_v2 = generate_sample_profile_v2_0()
    manager.create_profile(
        profile_id="profile_v2",
        version=SchemaVersion.V2_0,
        data=data_v2
    )

    print()

    # 2. Lister les profils
    print("📌 2. Profils disponibles")
    print("-" * 40)
    for profile_id in manager.list_profiles():
        version = manager.get_profile_version(profile_id)
        print(f"   - {profile_id}: {version}")
    print()

    # 3. Migration V1.0 → V1.1
    print("📌 3. Migration V1.0 → V1.1")
    print("-" * 40)
    migrated = manager.migrate_profile(
        profile_id="profile_v1",
        target_version=SchemaVersion.V1_1
    )

    if migrated:
        print(f"   ✅ Version actuelle: {manager.get_profile_version('profile_v1')}")
    print()

    # 4. Migration V1.1 → V2.0
    print("📌 4. Migration V1.1 → V2.0")
    print("-" * 40)
    migrated = manager.migrate_profile(
        profile_id="profile_v1",
        target_version=SchemaVersion.V2_0
    )

    if migrated:
        print(f"   ✅ Version actuelle: {manager.get_profile_version('profile_v1')}")
    print()

    # 5. Historique du profil
    print("📌 5. Historique du profil 'profile_v1'")
    print("-" * 40)
    history = manager.get_history("profile_v1")
    for entry, timestamp in history:
        print(f"   - {entry}: {datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # 6. Comparaison entre versions
    print("📌 6. Comparaison V1.0 vs V2.0")
    print("-" * 40)
    diff = manager.compare_profiles(
        profile_id="profile_v1",
        version1=SchemaVersion.V1_0,
        version2=SchemaVersion.V2_0
    )

    if 'error' in diff:
        print(f"   ❌ {diff['error']}")
    else:
        print(f"   Clés ajoutées: {len(diff['keys_added'])}")
        print(f"   Clés supprimées: {len(diff['keys_removed'])}")
        print(f"   Clés modifiées: {len(diff['keys_changed'])}")

        if diff['values_changed']:
            print("\n   Valeurs modifiées:")
            for key, change in list(diff['values_changed'].items())[:3]:
                print(f"      - {key}: {change['from']} → {change['to']}")
    print()

    # 7. Export du profil migré
    print("📌 7. Export du profil 'profile_v1'")
    print("-" * 40)
    export_path = "profile_v1_migrated.json"
    manager.export_profile("profile_v1", export_path)

    # 8. Import du profil
    print("\n📌 8. Import du profil exporté")
    print("-" * 40)
    imported_id = manager.import_profile(export_path)
    if imported_id:
        print(f"   ✅ Profil importé: {imported_id}")

    # Nettoyer
    if Path(export_path).exists():
        Path(export_path).unlink()

    print("\n" + "=" * 70)
    print("✅ Démonstration terminée")
    print("=" * 70)


if __name__ == "__main__":
    main()