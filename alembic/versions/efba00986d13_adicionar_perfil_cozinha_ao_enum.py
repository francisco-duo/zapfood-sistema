"""adicionar perfil cozinha ao enum

Revision ID: efba00986d13
Revises: 2a23e785050d
Create Date: 2026-07-26 13:34:25.573556

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'efba00986d13'
down_revision: Union[str, None] = '2a23e785050d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE perfil_usuario_enum ADD VALUE IF NOT EXISTS 'cozinha'")


def downgrade() -> None:
    # Postgres não permite remover um valor de enum diretamente; reverter
    # exigiria recriar o tipo e a coluna. Não suportado por este downgrade.
    pass
