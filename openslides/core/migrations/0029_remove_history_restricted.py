# Generated by Django 2.2.6 on 2019-10-28 11:44

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [("core", "0028_projector_size_3")]

    operations = [migrations.RemoveField(model_name="history", name="restricted")]
