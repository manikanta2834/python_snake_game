import shutil
import os

def zip_project():
    source_dir = 'c:/anti g'
    output_filename = 'c:/anti g/snake_project_backup'
    
    # Create a zip file
    shutil.make_archive(output_filename, 'zip', source_dir)
    print(f"Project zipped to {output_filename}.zip")

if __name__ == "__main__":
    zip_project()
