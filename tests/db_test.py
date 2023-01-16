import unittest

from backend.db import DBConnection
from Noted import DB_FILENAME

class Test_DB(unittest.TestCase):
	def test_foreign_key(self):
		DBConnection.file = DB_FILENAME
		instance = DBConnection(timeout=20.0)
		self.assertEqual(instance.cursor().execute("PRAGMA foreign_keys;").fetchone()[0], 1)
		
		