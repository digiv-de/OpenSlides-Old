from django.core.management.base import BaseCommand
from ...models import User, Group
from openslides.utils.autoupdate import inform_changed_data

class Command(BaseCommand):
    """
    Command to modify a user.
    
    Usage: python manage.py alteruser "admin" "del:Gast,del:Stimmberechtigt-Männlich"
    """

    help = "Aendert die Gruppenzugehoerigkeit eines User."

    def add_arguments(self, parser):
        parser.add_argument("user_name", help="Der Benutzername")
        parser.add_argument("groups", help="Gruppenliste add:GruppeA,del:GruppeB")

    def handle(self, *args, **options):
        try:
            user = User.objects.get(username=options['user_name'])
        except:
            self.stderr.write("Benutzer \"%s\" nicht vorhanden!" % options['user_name'])
            return

        modifications = options['groups'].split(',')
        for mod in modifications:
            action = mod.split(':')[0]
            groupName = mod.split(':')[1]
            if action not in ['add','del']:
                self.stderr.write("Kommando muss add: oder del: sein!")
                return
            
            # Gruppe finden
            try:
                group = Group.objects.get(name=groupName)
            except:
                self.stderr.write("Gruppe \"%s\" nicht vorhanden!" % groupName)
                return
            
            # Gruppenänderungen durchführen
            if action == "add":
                user.groups.add(group.id)
                self.stdout.write("ADD User zu %s" % groupName)
            else:
                user.groups.remove(group.id)
                self.stdout.write("DEL User von %s" % groupName)
            
            user.save(skip_autoupdate=False)
            inform_changed_data(user)
            